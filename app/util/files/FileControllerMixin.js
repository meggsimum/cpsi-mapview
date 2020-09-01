﻿Ext.define('CpsiMapview.util.files.FileControllerMixin', {
    extend: 'Ext.Mixin',
    requires: [
        'CpsiMapview.util.files.Report',
        'CpsiMapview.util.files.FileUploadWindow'
    ],

    onAddFileClick: function (btn) {
        var grid = btn.up('grid');
        var vm = this.getView().viewModel;
        var fileUploadWin = Ext.create('CpsiMapview.util.files.FileUploadWindow', {
            controller: this,
            viewModel: vm,
            listeners: {
                fileadded: 'onFileAdded',
                scope: this
            },
            uploadUrl: grid.store.getParentUrl(),
            parentType: 'Speed Limit'
        });

        fileUploadWin.show();
    },

    /*
    File uploads are not performed using normal 'Ajax' techniques, that is they are
    not performed using XMLHttpRequests.
    Instead the form is submitted in the standard manner with the DOM <form> element temporarily modified to have
    its target set to refer to a dynamically generated, hidden <iframe> which is inserted into the document but
    removed after the return data has been gathered.
    The server response is parsed by the browser to create the document for the IFRAME.
    If the server is using JSON to send the return object, then the Content-Type header must
    be set to 'text/html' in order to tell the browser to insert the text unchanged into the document body.

    Characters which are significant to an HTML parser must be sent as HTML entities,
    so encode '<' as '&lt;', '&' as '&amp;' etc.

    The response text is retrieved from the document, and a fake XMLHttpRequest object is created containing a
    responseText property in order to conform to the requirements of event handlers and callbacks.
    Be aware that file upload packets are sent with the content type multipart/form and some server
    technologies (notably JEE) may require some custom processing in order to retrieve parameter names
    and parameter values from the packet content.
    */


    onAttachmentSave: function (btn) {
        // JSON error messages are wrapped up in HTML
        // responseText: '<pre style='word-wrap: break-word; white-space: pre-wrap;'>{'success':false,'message':'The cookie header with user token has not been provided.'}</pre>'
        // so get just the error message
        // relevant link http://stackoverflow.com/questions/18150134/response-of-a-submit-form-is-adding-pre-to-json

        //The server response is parsed by the browser to create the document for the IFRAME.
        //If the server is using JSON to send the return object, then the Content-Type header
        //must be set to 'text/html' (on the server-side) in order to tell the browser to insert the text
        //unchanged into the document body.

        var win = btn.up('window');
        var form = win.down('form');
        if (form.isValid()) {
            var fileName = win.down('#filePath').getValue();
            var vm = this.getView().viewModel;
            form.submit({
                clientValidation: true,
                url: vm.getData().attachmentUploadUrl.replace('{0}', vm.getData().currentRecord.getId()),
                waitMsg: 'Uploading your file...',
                scope: win,
                success: function (form) {
                    var descrip = form.findField('documentDescription').getValue(),
                        name = form.findField('documentName').getValue();
                    // create a new object containing the attributes of the attachment
                    // after it was successfully associated
                    // with the parent object. This record can then be added to a store

                    var newFiledata = {
                        attachementId: '',
                        name: name,
                        description: descrip,
                        extension: 'Extension',
                        fileName: fileName,
                        fileSize: ''
                    };

                    // now show a message box to show the file was successfully uploaded
                    var msg = 'The file \'' + fileName + '\' has been associated with the ' + this.parentType;
                    Ext.Msg.alert('Success', msg, function () {
                        this.fireEvent('fileadded', newFiledata);
                    }, this);

                },
                failure: function (form, action) {
                    switch (action.failureType) {
                        case Ext.form.Action.CLIENT_INVALID:
                            Ext.Msg.alert('Failure', 'Form fields may not be submitted with invalid values');
                            break;
                        case Ext.form.Action.CONNECT_FAILURE:
                            Ext.Msg.alert('Failure', 'Ajax communication failed');
                            break;
                        case Ext.form.Action.SERVER_INVALID:
                            // the header for errors should be html/text
                            // however 404 errors or non-JSON errors will produce a huge error box
                            var txt = action.response.responseText;
                            Ext.Msg.alert('Server Error', txt);
                            break;
                        default:
                            break;
                    }
                }
            });
        }
    },

    onDeleteFileClick: function (grid, rowIndex, colIndex, item, e, rec/*, row*/) {
        var removeRecord = function (rec, gridView) {
            var store = gridView.getStore();
            store.remove(rec);
        };
        if (item.ignoreConfirmation === true) {
            removeRecord(rec, grid);
        } else {
            Ext.MessageBox.confirm('Delete Item?',
                'Do you want to delete this item?',
                function (btn) {
                    if (btn === 'yes') {
                        removeRecord(rec, grid);
                        return true;
                    } else {
                        return false;
                    }
                },
                this);
        }
    },

    onAttachmentCancelUpload: function (btn/*, evt*/) {
        btn.up('window').close();
    },

    onFileAdded: function () {
        var v = this.getView();
        v.getViewModel().getData().files.reload();
        v.close();
    },

    onDownloadFileClick: function (grid, record, element, rowIndex/*, e, eOpts*/) {
        var report = Ext.create('CpsiMapview.util.files.Report', {
            renderTo: Ext.getBody()
        });
        var url = grid.store.getAttachmentUrlFromIdx(rowIndex);
        report.load({
            url: url
        });
    }

});