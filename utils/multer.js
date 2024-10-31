const multer = require('multer');
const path = require('path');

module.exports = multer({
    storage: multer.diskStorage({}),
    fileFilter: (req, file, cb) => {
        let ext = path.extname(file.originalname);
        if (
            ext !== ".jpg" && ext !== ".jpeg" && ext !== ".png" && ext !== ".gif" &&
            ext !== ".mkv" && ext !== ".mp4" && ext !== ".mov" && ext !== ".avi" &&
            ext !== ".wmv" && ext !== ".flv" && ext !== ".webm" && ext !== ".3gp" &&
            ext !== ".mp3" && ext !== ".wav" && ext !== ".ogg" && ext !== ".aac" &&
            ext !== ".flac" && ext !== ".m4a" && ext !== ".aiff"
        ) {
            cb(new Error("File type is not supported"), false);
            return;
        }
        cb(null, true);
    }
}); 