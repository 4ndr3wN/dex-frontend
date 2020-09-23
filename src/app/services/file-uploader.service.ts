import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { API_CONFIG } from '../config/api-config';
import { UploadFile } from '../models/domain/uploadFile';

@Injectable({
  providedIn: 'root'
})
export class FileUploaderService {
  protected readonly url: string = API_CONFIG.url + API_CONFIG.uploadFileRoute;

  constructor(
    private http: HttpClient) { }

  private static buildFormData(file): FormData {
    // Build a form data object and add the fileData
    const formData = new FormData();
    formData.append('File', file);
    return formData;
  }

  public uploadFile(file: UploadFile): Observable<any> {
    const formData: FormData = FileUploaderService.buildFormData(file);
    return this.http.post(this.url, formData, {
      reportProgress: true,
      observe: 'events'
    }).pipe
    (
        catchError((error: HttpErrorResponse) => {
          // If the upload errors, notify the user
          return of(`${file.name} upload failed.`);
        })
    );
  }
}
