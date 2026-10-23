import sharp from 'sharp';
import exifReader from 'exif-reader';

export interface ParsedMetadata {
  cameraMake: string | null;
  cameraModel: string | null;
  lensModel: string | null;
  focalLength: number | null;
  iso: number | null;
  aperture: number | null;
  shutterSpeed: string | null;
  exposureBias: number | null;
  whiteBalance: string | null;
  colorSpace: string | null;
  dateTaken: number | null;
  rawExifJson: string | null;
}

export class MetadataService {
  public static async extract(filePath: string): Promise<{
    width: number;
    height: number;
    format: string;
    parsed: ParsedMetadata;
  }> {
    const instance = sharp(filePath, { failOnError: false });
    const metadata = await instance.metadata();

    const width = metadata.width || 0;
    const height = metadata.height || 0;
    const format = metadata.format || 'unknown';

    let cameraMake: string | null = null;
    let cameraModel: string | null = null;
    let lensModel: string | null = null;
    let focalLength: number | null = null;
    let iso: number | null = null;
    let aperture: number | null = null;
    let shutterSpeed: string | null = null;
    let exposureBias: number | null = null;
    let whiteBalance: string | null = null;
    let colorSpace: string | null = metadata.space || 'srgb';
    let dateTaken: number | null = null;
    let rawExifJson: string | null = null;

    if (metadata.exif) {
      try {
        const exifData = exifReader(metadata.exif);
        rawExifJson = JSON.stringify(exifData);

        const image = exifData.image;
        if (image) {
          if (typeof image.Make === 'string') cameraMake = image.Make.trim();
          if (typeof image.Model === 'string') cameraModel = image.Model.trim();
        }

        const exif = exifData.exif;
        if (exif) {
          if (typeof exif.LensModel === 'string') lensModel = exif.LensModel.trim();
          if (typeof exif.FocalLength === 'number') focalLength = exif.FocalLength;
          if (typeof exif.ISO === 'number') iso = exif.ISO;
          if (typeof exif.FNumber === 'number') aperture = Math.round(exif.FNumber * 10) / 10;
          if (typeof exif.ExposureTime === 'number') {
            shutterSpeed = exif.ExposureTime < 1
              ? `1/${Math.round(1 / exif.ExposureTime)}`
              : `${exif.ExposureTime}s`;
          }
          if (typeof exif.ExposureBiasValue === 'number') exposureBias = exif.ExposureBiasValue;
          if (exif.WhiteBalance !== undefined) {
            whiteBalance = exif.WhiteBalance === 1 ? 'Manual' : 'Auto';
          }
          if (exif.ColorSpace !== undefined) {
            colorSpace = exif.ColorSpace === 1 ? 'sRGB' : 'Adobe RGB / Display P3';
          }
          if (exif.DateTimeOriginal instanceof Date) {
            dateTaken = exif.DateTimeOriginal.getTime();
          }
        }
      } catch (err) {
        console.warn(`[METADATA] Failed to parse EXIF buffer for ${filePath}:`, err);
      }
    }

    return {
      width,
      height,
      format,
      parsed: {
        cameraMake,
        cameraModel,
        lensModel,
        focalLength,
        iso,
        aperture,
        shutterSpeed,
        exposureBias,
        whiteBalance,
        colorSpace,
        dateTaken,
        rawExifJson
      }
    };
  }
}
