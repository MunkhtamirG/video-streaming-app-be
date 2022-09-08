import { Request, Response } from "express";
import * as mediaService from "./media.services";
import formidable, { Fields } from "formidable";
import mongoose from "mongoose";
import Media from "./media.model";
import { User } from "../user";
import { GridFSBucket } from "mongodb";
import fs from "fs";
import router from "../../routes/v1";

let gridfs: GridFSBucket;
mongoose.connection.on("connected", () => {
  gridfs = new mongoose.mongo.GridFSBucket(mongoose.connection.db);
});

export const createMedia = async (req: Request, res: Response) => {
  let form = new formidable.IncomingForm();
  form.parse(req, async (err: Error, fields: Fields, files: any) => {
    if (err) {
      return res.status(400).json({
        error: "Video could not be uploaded",
      });
    }

    let media = new Media(fields);
    const user = await User.findById(media.userId);
    media.postedBy = user?._id;
    const file = files["video"];

    //save the parse file
    if (file) {
      let writeStream = gridfs.openUploadStream(media._id.toString(), {
        contentType: "binary/octet-stream",
      });
      fs.createReadStream(file.filepath).pipe(writeStream);
    }
    try {
      let result = await media.save();
      return res.status(200).json({
        data: result,
      });
    } catch (error) {
      return res.status(400).json({
        error: "Error during upload",
      });
    }
  });
};
export const getMediaById = async (req: Request, res: Response) => {
  const { mediaId } = req.params;
  const range = req.headers["range"];
  try {
    const media = await Media.findById(mediaId)
      .populate("postedBy", "_id firstName lastName")
      .exec();

    let files = await gridfs
      .find({
        filename: media?._id.toString(),
      })
      .toArray();
    let file = files[0];

    if (range && typeof range === "string") {
      const parts = range.replace(/bytes=/, "").split("-");
      const partialStart = parts[0];
      const partialEnd = parts[1];
      const start = parseInt(partialStart, 10);
      const end = partialEnd ? parseInt(partialEnd, 10) : file.length - 1;
      const chunkSize = end - start + 1;
      res.writeHead(206, {
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize.toString(),
        "Content-Range": "bytes " + start + "-" + end + "/" + file.length,
        "Content-Type": file.contentType,
      });

      let downloadStream = gridfs.openDownloadStream(file._id, {
        start,
        end: end + 1,
      });
      downloadStream.pipe(res);
      downloadStream.on("error", () => {
        res.sendStatus(404);
      });
      downloadStream.on("end", () => {
        res.end();
      });
    } else {
      //Whole chunk of videos
      res.header("Content-Length", file.length.toString());
      res.header("Content-Type", file.contentType);

      let downloadStream = gridfs.openDownloadStream(file._id);
      downloadStream.pipe(res);
      downloadStream.on("error", () => {
        res.sendStatus(404);
      });
      downloadStream.on("end", () => {
        res.end();
      });
    }
  } catch (error) {
    return res.status(404).json({
      error: "Colud not retrieve media file",
    });
  }
};
export const getMediaByUserId = async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    const media = await Media.find({ postedBy: userId });
    res.status(200).json({
      data: media,
    });
  } catch (error) {
    return res.status(404).json({
      error: "Colud not retrieve media file",
    });
  }
};

export const getMediaByTitle = async (req: Request, res: Response) => {
  const { title } = req.params;

  try {
    const media = await Media.find({ title: { $regex: title, $options: "i" } });
    await res.status(200).json({ data: media });
  } catch (error) {
    return res.status(404).json({
      error: "Colud not retrieve media file",
    });
  }
};

export const deleteMedia = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const dltVideo = await Media.deleteOne({ _id: id });
    await res.status(200).json({ dltVideo });
  } catch (error) {
    return res.status(404).json({
      error: "Colud not delete media",
    });
  }
};

export const updateMedia = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, description, genre } = req.body;

  try {
    const media = await Media.updateOne(
      { _id: id },
      { $set: { title: title, description: description, genre: genre } }
    );
    await res.status(200).json({ data: media });
  } catch (error) {
    return res.status(404).json({
      error: "Colud not delete media",
    });
  }
};

export const getMediaByGenre = async (req: Request, res: Response) => {
  const { genre } = req.params;
  try {
    const media = await Media.find({ genre: { $regex: genre, $options: "i" } });
    await res.status(200).json({ data: media });
  } catch (error) {
    return res.status(404).json({
      error: "Colud not delete media",
    });
  }
};

export const getMedia = async (req: Request, res: Response) => {
  try {
    const media = await Media.find();
    await res.status(200).json({ data: media });
  } catch (error) {
    return res.status(404).json({
      error: "Colud not delete media",
    });
  }
};

export const viewCount = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const media = await Media.updateOne({ _id: id }, { $inc: { views: 1 } });
    await res.status(200).json({ data: media });
  } catch (error) {
    return res.status(404).json({
      error: "Colud not delete media",
    });
  }
};
