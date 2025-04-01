const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

function findTargetFile() {
    const editor = vscode.window.activeTextEditor;
    if (!editor || !editor.document.fileName.endsWith('.i')) return;

    const document = editor.document;
    const currentLine = editor.selection.active.line;
    const currentLineText = document.lineAt(currentLine).text;
    
    let targetFile = '';
    let targetLine = 1;
    let searchPath = '';

    // 模式判断：当前行是否是#line指令
    const isCurrentLineDirective = currentLineText.startsWith('#line');

    if (isCurrentLineDirective) {
        // 模式1：当前行是#line指令，查找相同路径的首次#line 1指令
        const currentMatch = currentLineText.match(/^#line\s+(\d+)\s+"((?:\\"|[^"])+)"/);
        if (!currentMatch) return;
        
        searchPath = currentMatch[2]; // 保留原始路径大小写
        
        // 遍历整个文件找首次出现的#line 1指令
        for (let lineNum = 0; lineNum < document.lineCount; lineNum++) {
            const lineText = document.lineAt(lineNum).text;
            const match = lineText.match(/^#line\s+1\s+"((?:\\"|[^"])+)"/);
            if (match && match[1] === searchPath) {
                targetFile = match[1];
                targetLine = 1;
                break;
            }
        }
    } else {
        // 模式2：非#line行，向上查找最近的任意#line指令
        for (let lineNum = currentLine - 1; lineNum >= 0; lineNum--) {
            const lineText = document.lineAt(lineNum).text;
            const match = lineText.match(/^#line\s+(\d+)\s+"((?:\\"|[^"])+)"/);
            if (match) {
                targetLine = parseInt(match[1]);
                targetFile = match[2]; // 保留原始路径
                break;
            }
        }
    }

    if (targetFile) {
        vscode.window.showInformationMessage(`匹配路径: ${targetFile}, 行号: ${targetLine}`);
        return { targetFile, targetLine };
    }
}

async function openTargetDocument(targetFile, targetLine) {
    try {
        const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
            || path.dirname(vscode.window.activeTextEditor.document.uri.fsPath);

        const isAbsolute = path.isAbsolute(targetFile);
        const fullPath = isAbsolute ? targetFile : path.join(workspacePath, targetFile);

        if (!fs.existsSync(fullPath)) {
            vscode.window.showErrorMessage(vscode.l10n.t('fileNotExist', fullPath));
            return;
        }

        const doc = await vscode.workspace.openTextDocument(fullPath);
        
        // 验证行号有效性
        const maxLine = doc.lineCount;
        targetLine = Math.min(Math.max(targetLine, 1), maxLine);

        const editor = await vscode.window.showTextDocument(doc);
        const position = new vscode.Position(targetLine - 1, 0);
        editor.selection = new vscode.Selection(position, position);
        editor.revealRange(new vscode.Range(position, position));
    } catch (error) {
        vscode.window.showErrorMessage(vscode.l10n.t('pathResolveFailed', targetFile, error.message));
    }
}

function activate(context) {
    // 原有导航到首次引入位置命令
    let originCommand = vscode.commands.registerCommand('extension.navigateToOrigin', async () => {
        const result = findTargetFile();
        if (!result || !result.targetFile) {
            vscode.window.showInformationMessage(vscode.l10n.t('noLineDirectiveFound'));
            return;
        }

        try {
            const document = vscode.window.activeTextEditor.document;
            let firstMatchLine = -1;
            const searchPath = result.targetFile;
            
            for (let lineNum = 0; lineNum < document.lineCount; lineNum++) {
                const lineText = document.lineAt(lineNum).text;
                const lineMatch = lineText.match(/^#line\s+(\d+)\s+"((?:\\"|[^"])+)"/);
                if (lineMatch) {
                    if (lineMatch[2] === result.targetFile) {
                        firstMatchLine = lineNum + 1;
                        break;
                    }
                }
            }

            if (firstMatchLine > 0) {
                const position = new vscode.Position(firstMatchLine - 1, 0);
                vscode.window.showTextDocument(document, { selection: new vscode.Range(position, position) });
            } else {
                vscode.window.showErrorMessage(vscode.l10n.t('originLineNotFound'));
            }
        } catch (error) {
            vscode.window.showErrorMessage(vscode.l10n.t('pathResolveFailed', result.targetFile, error.message));
        }
    });

    // 新增打开目标文件命令
    let openCommand = vscode.commands.registerCommand('extension.openTargetFile', async () => {
        const result = findTargetFile();
        if (result && result.targetFile) {
            await openTargetDocument(result.targetFile, result.targetLine);
        } else {
            vscode.window.showInformationMessage(vscode.l10n.t('noLineDirectiveFound'));
        }
    });


    context.subscriptions.push(originCommand, openCommand);
}

function deactivate() {}

module.exports = { activate, deactivate };