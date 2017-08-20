import {window, commands, Disposable, ExtensionContext, StatusBarAlignment, StatusBarItem, TextDocument} from 'vscode';
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

    console.log('Extension "registerview" was activated!');

    let watchRegisters = new WatchRegisters();

    let disposable = vscode.commands.registerCommand('extension.watchRegisters', () => {

        // Display a message box to the user
        watchRegisters.updateRegisterList();
    });

    let subscriptions: Disposable[] = [];
    window.onDidChangeTextEditorSelection(watchRegisters.onEvent, watchRegisters, subscriptions);
    window.onDidChangeActiveTextEditor(watchRegisters.onEvent, watchRegisters, subscriptions)

    context.subscriptions.push(disposable);
    context.subscriptions.push(watchRegisters);
}

export function deactivate() {
}

class WatchRegisters {

    private _statusBarItem: StatusBarItem;
    
    public updateRegisterList() {

        if (!this._statusBarItem) {
            this._statusBarItem = window.createStatusBarItem(StatusBarAlignment.Right);
        }

        let editor = window.activeTextEditor;
        if (!editor) {
            this._statusBarItem.hide();
            return;
        }

        let doc = editor.document;
        let text = "";

        if (editor.selection.isEmpty) {
            text = doc.getText();
        } else {
            let selection = editor.selection;
            text = doc.getText(selection);
        }

        this._statusBarItem.text = this._makeStatusMessage(text);
        this._statusBarItem.show();
    }

    public _makeStatusMessage(text: string) : string {

        let scalarRegs = new Array<boolean>(32);
        let vectorRegs = new Array<boolean>(32);
        let predicateRegs = new Array<boolean>(8);
        let vectorPredicateRegs = new Array<boolean>(8);

        let status = "";
        text = text.replace(new RegExp("[,.*+()\r\n]", "g"), ' ');
        let words = text.split(" ");
        words.forEach(word => {
            if (word.match("^r\\d+$")) {
                let regNumber = Number(word.substr(1));
                scalarRegs[regNumber] = true;
            } 
            else if (word.match("^v\\d+$")) {
                let regNumber = Number(word.substr(1));
                vectorRegs[regNumber] = true;
            }
            else if (word.match("^p\\d$")) {
                let regNumber = Number(word.substr(1));
                predicateRegs[regNumber] = true;
            }
            else if (word.match("^vp\\d+$")) {
                let regNumber = Number(word.substr(2));
                vectorPredicateRegs[regNumber] = true;
            }
        });
        return "r: " + this._registerListToString(scalarRegs) +
                "  p: " + this._registerListToString(predicateRegs) +
                "  v: " + this._registerListToString(vectorRegs) +
                "  vp: " + this._registerListToString(vectorPredicateRegs);
    }

    public _registerListToString(regsArray: Array<boolean>) : string {
        let records = []

        let first = null;
        for (let i = 0; i <= regsArray.length; i++) {
            if (i < regsArray.length && regsArray[i] == true) {
                if (first == null) { 
                    first = i;
                } 
            } else {
                if (first != null) {
                    if (first == i - 1)
                        records.push((i-1).toString())
                    else 
                        records.push(first.toString() + "-" + (i-1).toString());
                    first = null;
                }
            }
        }

        return records.join(",");
    }

    public onEvent() {
        this.updateRegisterList();
    }

    dispose() {
        this._statusBarItem.dispose();
    }
}