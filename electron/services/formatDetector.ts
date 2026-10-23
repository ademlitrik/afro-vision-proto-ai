import path from 'path';

export type FormatSupportStatus = 
  | 'NATIVELY_SUPPORTED' 
  | 'RAW_SUPPORTED_VIA_PREVIEW' 
  | 'RAW_REQUIRES_EXT_DECODER' 
  | 'UNSUPPORTED';

export interface FormatDetails {
  extension: string;
  category: 'standard' | 'pro' | 'raw' | 'unsupported';
  cameraBrand?: string;
  supportStatus: FormatSupportStatus;
  mimeType: string;
  description: string;
}

export class FormatDetector {
  private static readonly FORMAT_MAP: Record<string, Omit<FormatDetails, 'extension'>> = {
    // Standard Image Formats (Sharp native)
    '.jpg': {
      category: 'standard',
      supportStatus: 'NATIVELY_SUPPORTED',
      mimeType: 'image/jpeg',
      description: 'JPEG Standard'
    },
    '.jpeg': {
      category: 'standard',
      supportStatus: 'NATIVELY_SUPPORTED',
      mimeType: 'image/jpeg',
      description: 'JPEG Standard'
    },
    '.png': {
      category: 'standard',
      supportStatus: 'NATIVELY_SUPPORTED',
      mimeType: 'image/png',
      description: 'Portable Network Graphics'
    },
    '.webp': {
      category: 'standard',
      supportStatus: 'NATIVELY_SUPPORTED',
      mimeType: 'image/webp',
      description: 'WebP Image'
    },
    '.tif': {
      category: 'pro',
      supportStatus: 'NATIVELY_SUPPORTED',
      mimeType: 'image/tiff',
      description: 'Tagged Image File Format'
    },
    '.tiff': {
      category: 'pro',
      supportStatus: 'NATIVELY_SUPPORTED',
      mimeType: 'image/tiff',
      description: 'Tagged Image File Format'
    },
    '.heic': {
      category: 'pro',
      supportStatus: 'NATIVELY_SUPPORTED',
      mimeType: 'image/heic',
      description: 'High Efficiency Image Container'
    },
    '.heif': {
      category: 'pro',
      supportStatus: 'NATIVELY_SUPPORTED',
      mimeType: 'image/heif',
      description: 'High Efficiency Image Format'
    },

    // RAW Camera Formats (Prepared Extensibility Layer)
    '.dng': {
      category: 'raw',
      cameraBrand: 'Adobe / Universal RAW',
      supportStatus: 'RAW_SUPPORTED_VIA_PREVIEW',
      mimeType: 'image/x-adobe-dng',
      description: 'Adobe Digital Negative RAW'
    },
    '.cr2': {
      category: 'raw',
      cameraBrand: 'Canon',
      supportStatus: 'RAW_SUPPORTED_VIA_PREVIEW',
      mimeType: 'image/x-canon-cr2',
      description: 'Canon CR2 RAW'
    },
    '.cr3': {
      category: 'raw',
      cameraBrand: 'Canon',
      supportStatus: 'RAW_REQUIRES_EXT_DECODER',
      mimeType: 'image/x-canon-cr3',
      description: 'Canon CR3 RAW (Requires LibRaw decoder extension)'
    },
    '.nef': {
      category: 'raw',
      cameraBrand: 'Nikon',
      supportStatus: 'RAW_SUPPORTED_VIA_PREVIEW',
      mimeType: 'image/x-nikon-nef',
      description: 'Nikon Electronic Format RAW'
    },
    '.arw': {
      category: 'raw',
      cameraBrand: 'Sony',
      supportStatus: 'RAW_SUPPORTED_VIA_PREVIEW',
      mimeType: 'image/x-sony-arw',
      description: 'Sony Alpha RAW'
    },
    '.raf': {
      category: 'raw',
      cameraBrand: 'Fujifilm',
      supportStatus: 'RAW_SUPPORTED_VIA_PREVIEW',
      mimeType: 'image/x-fuji-raf',
      description: 'Fujifilm RAW Format'
    },
    '.orf': {
      category: 'raw',
      cameraBrand: 'Olympus',
      supportStatus: 'RAW_SUPPORTED_VIA_PREVIEW',
      mimeType: 'image/x-olympus-orf',
      description: 'Olympus Raw Format'
    },
    '.rw2': {
      category: 'raw',
      cameraBrand: 'Panasonic',
      supportStatus: 'RAW_SUPPORTED_VIA_PREVIEW',
      mimeType: 'image/x-panasonic-rw2',
      description: 'Panasonic Lumix RAW'
    }
  };

  public static detect(filePathOrExt: string): FormatDetails {
    let ext = path.extname(filePathOrExt).toLowerCase();
    if (!ext) {
      ext = filePathOrExt.toLowerCase();
      if (!ext.startsWith('.')) {
        ext = '.' + ext;
      }
    }
    const match = this.FORMAT_MAP[ext];

    if (!match) {
      return {
        extension: ext,
        category: 'unsupported',
        supportStatus: 'UNSUPPORTED',
        mimeType: 'application/octet-stream',
        description: `Unsupported format (${ext || 'unknown'})`
      };
    }

    return {
      extension: ext,
      ...match
    };
  }

  public static isSupportedExtension(filePathOrExt: string): boolean {
    const details = this.detect(filePathOrExt);
    return details.supportStatus !== 'UNSUPPORTED';
  }

  public static getSupportedExtensions(): string[] {
    return Object.keys(this.FORMAT_MAP);
  }
}
