import "reflect-metadata";
import {createConnection, getRepository} from "typeorm";
import { Photo } from "./entity/Photo";

createConnection().then(async connection => {

    // let photo = new Photo();
    // photo.name = "giyong2 and soyeon2"
    // photo.description = "hihi"
    // photo.filename = "what.jpg"
    // photo.views = 1;
    // photo.isPublished = true


    // await connection.manager.save(photo)
    // console.log("Photo has been saved");

    // let savedPhotos = await connection.manager.find(Photo);
    // console.log("All photos from the db: ", savedPhotos);


    /*...*/
    const photoRepository = getRepository(Photo)
    let allPhotos = await photoRepository.find();
    console.log("All photos from the db: ", allPhotos);

    let firstPhoto = await photoRepository.findOne(1);
    console.log("First photo from the db: ", firstPhoto);

      let meAndBearsPhoto = await photoRepository.findOne({ name: "giyong and soyeon" });
     console.log("Me and Bears photo from the db: ", meAndBearsPhoto);

      let allViewedPhotos = await photoRepository.find({ views: 1 });
     console.log("All viewed photos: ", allViewedPhotos);

    let allPublishedPhotos = await photoRepository.find({ isPublished: true });
     console.log("All published photos: ", allPublishedPhotos);

    let [allPhotos, photosCount] = await photoRepository.findAndCount();
    console.log("All photos: ", allPhotos);
    console.log("Photos count: ", photosCount);


}).catch(error => console.log(error));
