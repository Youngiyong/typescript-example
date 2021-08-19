import "reflect-metadata";
import {createConnection, getRepository} from "typeorm";
import { Photo } from "./entity/Photo";
import { Album } from "./entity/Album";
import { Photo } from "./entity/Photo";
import { PhotoMetadata } from "./entity/PhotoMetaData";

let connection = await createConnection(options);

// create a few albums
let album1 = new Album();
album1.name = "Bears";
await connection.manager.save(album1);

let album2 = new Album();
album2.name = "Me";
await connection.manager.save(album2);

// create a few photos
let photo = new Photo();
photo.name = "Me and Bears";
photo.description = "I am near polar bears";
photo.filename = "photo-with-bears.jpg";
photo.views = 1
photo.isPublished = true
photo.albums = [album1, album2];
await connection.manager.save(photo);

let photos = await connection
    .getRepository(Photo)
    .createQueryBuilder("photo") // first argument is an alias. Alias is what you are selecting - photos. You must specify it.
    .innerJoinAndSelect("photo.metadata", "metadata")
    .leftJoinAndSelect("photo.albums", "album")
    .where("photo.isPublished = true")
    .andWhere("(photo.name = :photoName OR photo.name = :bearName)")
    .orderBy("photo.id", "DESC")
    .skip(5)
    .take(10)
    .setParameters({ photoName: "My", bearName: "Mishka" })
    .getMany();

console.log(photos)
// now our photo is saved and albums are attached to it
// now lets load them:
const loadedPhoto = await connection
    .getRepository(Photo)
    .findOne(1, { relations: ["albums"] });

console.log(loadedPhoto)
// createConnection().then(async connection => {

//     // let photo = new Photo();
//     // photo.name = "giyong2 and soyeon2"
//     // photo.description = "hihi"
//     // photo.filename = "what.jpg"
//     // photo.views = 1;
//     // photo.isPublished = true


//     // await connection.manager.save(photo)
//     // console.log("Photo has been saved");

//     // let savedPhotos = await connection.manager.find(Photo);
//     // console.log("All photos from the db: ", savedPhotos);


//     /*...*/
//     // const photoRepository = getRepository(Photo)
//     // let allPhotos = await photoRepository.find();
//     // console.log("All photos from the db: ", allPhotos);

//     // let firstPhoto = await photoRepository.findOne(1);
//     // console.log("First photo from the db: ", firstPhoto);

//     //   let meAndBearsPhoto = await photoRepository.findOne({ name: "giyong and soyeon" });
//     //  console.log("Me and Bears photo from the db: ", meAndBearsPhoto);

//     //   let allViewedPhotos = await photoRepository.find({ views: 1 });
//     //  console.log("All viewed photos: ", allViewedPhotos);

//     // let allPublishedPhotos = await photoRepository.find({ isPublished: true });
//     //  console.log("All published photos: ", allPublishedPhotos);

//     // let [allPhotos, photosCount] = await photoRepository.findAndCount();
//     // console.log("All photos: ", allPhotos);
//     // console.log("Photos count: ", photosCount);


//     // create a photo
//     // let photo = new Photo();
//     // photo.name = "Me and Bears";
//     // photo.description = "I am near polar bears";
//     // photo.filename = "photo-with-bears.jpg";
//     // photo.views = 1;
//     // photo.isPublished = true;

//     // // create a photo metadata
//     // let metadata = new PhotoMetadata();
//     // metadata.height = 640;
//     // metadata.width = 480;
//     // metadata.compressed = true;
//     // metadata.comment = "cybershoot";
//     // metadata.orientation = "portrait";
//     // metadata.photo = photo; // this way we connect them

//     // // get entity repositories
//     // let photoRepository = connection.getRepository(Photo);
//     // let metadataRepository = connection.getRepository(PhotoMetadata);

//     // // first we should save a photo
//     // // await photoRepository.save(photo);

//     // // photo is saved. Now we need to save a photo metadata
//     // await metadataRepository.save(metadata);

//     // // done
//     // console.log("Metadata is saved, and relation between metadata and photo is created in the database too");
//     /*...*/
//     // let photoRepository = connection.getRepository(Photo);
//     // let photos = await photoRepository.find({ relations: ["metadata"] });
//     // console.log(photos)

//     // /*...*/
//     // let photos = await connection
//     //     .getRepository(Photo)
//     //     .createQueryBuilder("photo")
//     //     .innerJoinAndSelect("photo.metadata", "metadata")
//     //     .getMany();


//     // create photo object
//     // let photo = new Photo();
//     // photo.name = "Me and Bears";
//     // photo.description = "I am near polar bears";
//     // photo.filename = "photo-with-bears.jpg";
//     // photo.isPublished = true;

//     // // create photo metadata object
//     // let metadata = new PhotoMetadata();
//     // metadata.height = 640;
//     // metadata.width = 480;
//     // metadata.compressed = true;
//     // metadata.comment = "cybershoot";
//     // metadata.orientation = "portrait";

//     // photo.metadata = metadata; // this way we connect them

//     // // get repository
//     // let photoRepository = connection.getRepository(Photo);

//     // // saving a photo also save the metadata
//     // await photoRepository.save(photo);

//     // console.log("Photo is saved, photo metadata is saved too.")

// }).catch(error => console.log(error));
