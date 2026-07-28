import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { nanoid } from "nanoid";
import path from "path";
import { getR2Client, getR2Bucket, getR2PublicUrl } from "../config/r2.js";

export async function uploadBufferToR2(buffer, originalName, mimetype, folder = "profile-images") {
  const key = `${folder}/${nanoid()}${path.extname(originalName)}`;

  await getR2Client().send(
    new PutObjectCommand({
      Bucket: getR2Bucket(),
      Key: key,
      Body: buffer,
      ContentType: mimetype,
    }),
  );

  return { key, url: `${getR2PublicUrl()}/${key}` };
}

export async function deleteFromR2(key) {
  if (!key) return;
  await getR2Client().send(new DeleteObjectCommand({ Bucket: getR2Bucket(), Key: key })).catch(() => {});
}
