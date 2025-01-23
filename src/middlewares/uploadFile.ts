// export const handleCSVUpload = (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   upload.single("file")(req, res, (err: any) => {
//     console.log("req", req);
//     console.log("req.file", req.file, req.files);
//     console.log("file", typeof req.file, typeof req.files);

//     if (err) {
//       console.log("error in multertConfig", err);

//       // Handle file size error
//       if (err.code === "LIMIT_FILE_SIZE") {
//         return res.status(400).json({
//           message: `${err.message}. Only file size less than 1MB is supported`,
//         });
//       }

//       // Handle invalid file type error
//       if (err.code === "ERROR_FILE_TYPE") {
//         return res.status(400).json({ message: err.message });
//       }

//       // Handle incorrect field name or more than 1 file being uploaded
//       if (err.code === "LIMIT_UNEXPECTED_FILE") {
//         // Handle more than 1 file being uploaded
//         if (err.field !== "file") {
//           return res.status(400).json({
//             message: `${err.message}. File should be uploaded under the 'file' field.`,
//           });
//         }
//         // // Handle more than 1 file being uploaded under an unexpected field
//         return res
//           .status(400)
//           .json({ message: "Only one file should be uploaded" });
//       }

//       // Handle other errors
//       return res
//         .status(500)
//         .json({ message: "File upload error.", error: err.message });
//     }

//     // Continue to the next route handler
//     next();
//   });
// };
