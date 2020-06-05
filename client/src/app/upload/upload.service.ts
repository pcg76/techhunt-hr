import { Injectable } from '@angular/core'
import {
  HttpClient,
  HttpRequest,
  HttpEventType,
  HttpResponse,
} from '@angular/common/http'
import { Subject, Observable } from 'rxjs'

const url = 'http://localhost:3000/users'

@Injectable()
export class UploadService {
  constructor(private http: HttpClient) { }

  public upload(files: File): { [key: string]: { progress: Observable<number> } } {

    // this will be the our resulting map
    const status: { [key: string]: { progress: Observable<number> } } = {};

    // create a new multipart-form for every file
    const formData: FormData = new FormData();
    formData.append('file', files, files.name);

    // create a http-post request and pass the form
    // tell it to report the upload progress
    const req = new HttpRequest('POST', url + '/upload', formData, {
      reportProgress: true
    });

    // create a new progress-subject for every file
    const progress = new Subject<number>();

    // send the http-request and subscribe for progress-updates
    this.http.request(req).subscribe(
      event => {
        if (event.type === HttpEventType.UploadProgress) {

          // calculate the progress percentage
          const percentDone = Math.round(100 * event.loaded / event.total);

          // pass the percentage into the progress-stream
          progress.next(percentDone);
        } else if (event instanceof HttpResponse) {
          // Close the progress-stream if we get an answer form the API
          // The upload is complete
          console.log(event.body);
          progress.complete();
        }
      },
      error => {
        progress.next(-1);
        progress.complete();
      }
    );

    // Save every progress-observable in a map of all observables
    status[files.name] = {
      progress: progress.asObservable()
    };

    // return the map of progress.observables
    return status;
  }
}