import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { WysiwygEditorComponent } from './wysiwyg-editor/wysiwyg-editor.component';

@NgModule({
  declarations: [
    WysiwygEditorComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule
  ],
  bootstrap: [WysiwygEditorComponent]
})
export class AppModule {} 