declare module "multer" {
  import { RequestHandler } from "express";

  interface MulterOptions {
    dest?: string;
    storage?: any;
    limits?: {
      fieldNameSize?: number;
      fieldSize?: number;
      fields?: number;
      fileSize?: number;
      files?: number;
      parts?: number;
      headerPairs?: number;
    };
    fileFilter?: (req: any, file: any, cb: (error: any, acceptFile: boolean) => void) => void;
  }

  interface MulterInstance {
    single(fieldName: string): RequestHandler;
    array(fieldName: string, maxCount?: number): RequestHandler;
    fields(fields: Array<{ name: string; maxCount?: number }>): RequestHandler;
    none(): RequestHandler;
    any(): RequestHandler;
  }

  function multer(options?: MulterOptions): MulterInstance;

  namespace multer {
    function memoryStorage(): any;
    function diskStorage(options: any): any;
  }

  export = multer;
}
