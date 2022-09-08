import { IMediaDoc } from "./media.interfaces";
import Media from "./media.model";

export const getMediaByTitle = async (title: any) => {
  return Media.findOne({ title: { $in: [title] } });
};
