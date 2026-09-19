package com.restaurant.backend.Controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/reviews")
public class ReviewImageController {

    private final Path uploadDirectory =
            Paths.get("uploads/reviews")
                    .toAbsolutePath()
                    .normalize();

    private static final long MAX_FILE_SIZE =
            5L * 1024 * 1024;

    private static final Set<String> ALLOWED_EXTENSIONS =
            Set.of(
                    ".jpg",
                    ".jpeg",
                    ".png",
                    ".webp"
            );

    // =====================================================
    // UPLOAD REVIEW IMAGE
    // =====================================================

    @PostMapping(
            value = "/upload-image",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<?> uploadImage(
            @RequestParam("image") MultipartFile image
    ) {

        // -------------------------------------------------
        // BASIC VALIDATION
        // -------------------------------------------------

        if (image == null ||
                image.isEmpty()) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "message",
                                    "Image is required"
                            )
                    );
        }

        // -------------------------------------------------
        // SIZE VALIDATION
        // -------------------------------------------------

        if (image.getSize() > MAX_FILE_SIZE) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "message",
                                    "Image must be smaller than 5 MB"
                            )
                    );
        }

        // -------------------------------------------------
        // CONTENT TYPE VALIDATION
        // -------------------------------------------------

        String contentType =
                image.getContentType();

        Set<String> allowedContentTypes =
                Set.of(
                        MediaType.IMAGE_JPEG_VALUE,
                        MediaType.IMAGE_PNG_VALUE,
                        "image/webp"
                );

        if (contentType == null ||
                !allowedContentTypes.contains(
                        contentType.toLowerCase(Locale.ROOT)
                )) {

            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(
                            Map.of(
                                    "message",
                                    "Only JPG, JPEG, PNG and WEBP images are allowed"
                            )
                    );
        }

        // -------------------------------------------------
        // ORIGINAL FILE NAME
        // -------------------------------------------------

        String originalName =
                image.getOriginalFilename();

        if (originalName == null ||
                originalName.isBlank()) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "message",
                                    "Invalid image filename"
                            )
                    );
        }

        // -------------------------------------------------
        // GET SAFE EXTENSION
        // -------------------------------------------------

        String extension =
                getSafeExtension(
                        originalName
                );

        if (extension == null) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "message",
                                    "Unsupported image format"
                            )
                    );
        }

        // -------------------------------------------------
        // CREATE DIRECTORY
        // -------------------------------------------------

        try {

            Files.createDirectories(
                    uploadDirectory
            );

        } catch (IOException e) {

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(
                            Map.of(
                                    "message",
                                    "Failed to create upload directory"
                            )
                    );
        }

        // -------------------------------------------------
        // UNIQUE FILE NAME
        // -------------------------------------------------

        String fileName =
                UUID.randomUUID()
                        .toString()
                        + extension;

        // -------------------------------------------------
        // SAFE PATH
        // -------------------------------------------------

        Path filePath =
                uploadDirectory
                        .resolve(fileName)
                        .normalize();

        /*
         * Extra protection against path traversal.
         */
        if (!filePath.startsWith(
                uploadDirectory
        )) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "message",
                                    "Invalid file path"
                            )
                    );
        }

        // -------------------------------------------------
        // SAVE FILE
        // -------------------------------------------------

        try {

            Files.copy(
                    image.getInputStream(),
                    filePath,
                    StandardCopyOption.REPLACE_EXISTING
            );

        } catch (IOException e) {

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(
                            Map.of(
                                    "message",
                                    "Failed to upload image"
                            )
                    );
        }

        // -------------------------------------------------
        // RETURN URL
        // -------------------------------------------------

        String imageUrl =
                "/uploads/reviews/"
                        + fileName;

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        Map.of(
                                "message",
                                "Image uploaded successfully",

                                "photoUrl",
                                imageUrl
                        )
                );
    }


    // =====================================================
    // SAFE EXTENSION
    // =====================================================

    private String getSafeExtension(
            String originalName
    ) {

        /*
         * Extract only the final extension.
         */
        String cleanName =
                Paths.get(originalName)
                        .getFileName()
                        .toString();

        int dotIndex =
                cleanName.lastIndexOf('.');

        if (dotIndex < 0) {
            return null;
        }

        String extension =
                cleanName
                        .substring(dotIndex)
                        .toLowerCase(Locale.ROOT);

        if (!ALLOWED_EXTENSIONS.contains(
                extension
        )) {

            return null;
        }

        return extension;
    }
}