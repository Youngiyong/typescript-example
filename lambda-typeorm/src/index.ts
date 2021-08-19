import "reflect-metadata";
import {createConnection, getRepository} from "typeorm";
import { Photo } from "./entity/Photo";
import { PhotoMetadata } from "./entity/PhotoMetaData";
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
    // const photoRepository = getRepository(Photo)
    // let allPhotos = await photoRepository.find();
    // console.log("All photos from the db: ", allPhotos);

    // let firstPhoto = await photoRepository.findOne(1);
    // console.log("First photo from the db: ", firstPhoto);

    //   let meAndBearsPhoto = await photoRepository.findOne({ name: "giyong and soyeon" });
    //  console.log("Me and Bears photo from the db: ", meAndBearsPhoto);

    //   let allViewedPhotos = await photoRepository.find({ views: 1 });
    //  console.log("All viewed photos: ", allViewedPhotos);

    // let allPublishedPhotos = await photoRepository.find({ isPublished: true });
    //  console.log("All published photos: ", allPublishedPhotos);

    // let [allPhotos, photosCount] = await photoRepository.findAndCount();
    // console.log("All photos: ", allPhotos);
    // console.log("Photos count: ", photosCount);


    // create a photo
    let photo = new Photo();
    photo.name = "Me and Bears";
    photo.description = "I am near polar bears";
    photo.filename = "photo-with-bears.jpg";
    photo.views = 1;
    photo.isPublished = true;

    // create a photo metadata
    let metadata = new PhotoMetadata();
    metadata.height = 640;
    metadata.width = 480;
    metadata.compressed = true;
    metadata.comment = "cybershoot";
    metadata.orientation = "portrait";
    metadata.photo = photo; // this way we connect them

    // get entity repositories
    let photoRepository = connection.getRepository(Photo);
    let metadataRepository = connection.getRepository(PhotoMetadata);

    // first we should save a photo
    // await photoRepository.save(photo);

    // photo is saved. Now we need to save a photo metadata
    await metadataRepository.save(metadata);

    // done
    console.log("Metadata is saved, and relation between metadata and photo is created in the database too");


}).catch(error => console.log(error));
