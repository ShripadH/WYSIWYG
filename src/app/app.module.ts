import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { WysiwygEditorComponent } from './wysiwyg-editor/wysiwyg-editor.component';
import { SyntaxHighlightPipe } from './wysiwyg-editor/syntax-highlight.pipe';

@NgModule({
  declarations: [
    WysiwygEditorComponent,
    SyntaxHighlightPipe
  ],
  imports: [
    BrowserModule,
    HttpClientModule
  ],
  bootstrap: [WysiwygEditorComponent]
})
export class AppModule {} 