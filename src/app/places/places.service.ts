import { Place } from 'src/app/places/place.model';
import { AuthService } from './../auth/auth.service';
import { Injectable } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';
import { take, map, tap, delay, switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { PlaceLocation } from './location.model';

interface PlaceData {
  availableFrom: string;
  availableTo: string;
  description: string;
  imageUrl: string;
  price: number;
  title: string;
  userId: string;
  location: PlaceLocation;
}

// new Place(
//   'p1',
//   'manhattan Mansion',
//   'In the heart of New York City',
//   'https://ds4.cityrealty.com/img/45f400ad66da3a16eaa0c2e8ab4bb09ee10e8721+w+h+0+60/manhattan-house-200-east-66th-street-01.jpg',
//   149.99,
//   new Date('2019-01-01'),
//   new Date('2019-12-31'),
//   'abc'
// ),
// new Place(
//   'p2',
//   'Amour Toujours',
//   'A romantic place in Paris',
//   'http://static1.squarespace.com/static/5236f137e4b0588d65814e39/t/57700a05d1758ef2e6df0b66/1466960549052/The+Ritz+Paris%E2%80%99s+Grand+Reopening?format=1500w',
//   249.99,
//   new Date('2019-01-01'),
//   new Date('2019-12-31'),
//   'abc'
// ),
// new Place (
//   'p3',
//   'San Francisco city',
//   'Best house in town',
//   'https://media.nbcsandiego.com/images/653*367/FullHouseHouse.JPG',
//   189.90,
//   new Date('2019-01-01'),
//   new Date('2019-12-31'),
//   'abc'
// )


@Injectable({
  providedIn: 'root'
})
export class PlacesService {
  private _places = new BehaviorSubject<Place[]>([]);


  get places() {
    return this._places.asObservable();
  }

  constructor(private authService: AuthService, private http: HttpClient ) { }

  fetchPlaces() {
    return this.http.get<{ [key: string]: PlaceData }>('https://ionic-angular-course-f37f6.firebaseio.com/offered-places.json').pipe(
      map(resData => {
        const places = [];
        for (const key in resData) {
          if (resData.hasOwnProperty(key)) {
            places.push(
              new Place(
                key,
                resData[key].title,
                resData[key].description,
                resData[key].imageUrl,
                resData[key].price,
                new Date(resData[key].availableFrom),
                new Date(resData[key].availableTo),
                resData[key].userId,
                resData[key].location
            )
            );
          }
        }
        return places;
      }),
      tap(places => {
        this._places.next(places);
      })
    );
  }

  getPlace(id: string) {
    return this.http.get<PlaceData>(
      `https://ionic-angular-course-f37f6.firebaseio.com/offered-places/${id}.json`
      ).pipe(
        map(placeData => {
          return new Place(
            id,
            placeData.title,
            placeData.description,
            placeData.imageUrl,
            placeData.price,
            new Date(placeData.availableFrom),
            new Date(placeData.availableTo),
            placeData.userId,
            placeData.location
            );
        })
      );
  }

  uploadImage(image: File) {
    const uploadData = new FormData();
    uploadData.append('image', image);

    return this.http.post<{imageUrl: string, imagePath: string}>
    ('https://us-central1-ionic-angular-course-f37f6.cloudfunctions.net/storeImage', uploadData);
  }

  addPlace(title: string, description: string, price: number, dateFrom: Date, dateTo: Date, location: PlaceLocation, imageUrl: string) {
    let generatedId: string;
    const newPlace = new Place(
      Math.random().toString(),
      title,
      description,
      imageUrl,
      price,
      dateFrom,
      dateTo,
      this.authService.userId,
      location
      );
    return this.http.post<{name: string}>
    ('https://ionic-angular-course-f37f6.firebaseio.com/offered-places.json', { ...newPlace, id: null}).pipe(
     switchMap(resData => {
      generatedId = resData.name;
      return this.places;
     }),
     take(1),
     tap(places => {
       newPlace.id = generatedId;
       this._places.next(places.concat(newPlace));
     })
    );
    // return this.places.pipe(
    //   (take(1)),
    //   delay(1000),
    //   tap(places => {
    //     this._places.next(places.concat(newPlace));
    // })
    // );
  }

  updatePlace(placeId: string, title: string, description: string) {
    let updatedPlaces: Place[];

    return this.places.pipe(
      take(1),
      switchMap(places => {
        if (!places || places.length <= 0) {
          return this.fetchPlaces();
        } else {
          return of(places);
        }
      }),
      switchMap(places => {
        const updatedPlaceIndex = places.findIndex(pl => pl.id === placeId);
        updatedPlaces = [...places];
        const oldPlace = updatedPlaces[updatedPlaceIndex];
        updatedPlaces[updatedPlaceIndex] = new Place(
          oldPlace.id,
          title,
          description,
          oldPlace.imageUrl,
          oldPlace.price,
          oldPlace.availableFrom,
          oldPlace.availableTo,
          oldPlace.userId,
          oldPlace.location
        );
        return this.http.put(`https://ionic-angular-course-f37f6.firebaseio.com/offered-places/${placeId}.json`,
         {...updatedPlaces[updatedPlaceIndex], id: null}
         );
      }),
      tap(places => {
      this._places.next(updatedPlaces);
    }));
  }

}
