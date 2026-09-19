package com.restaurant.backend.Service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.MultiFormatWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.client.j2se.MatrixToImageWriter;

import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;

@Service
public class QRCodeService {

    public byte[] generateQRCode(
            String text,
            int width,
            int height
    ) {

        try {

            BitMatrix matrix =
                    new MultiFormatWriter().encode(
                            text,
                            BarcodeFormat.QR_CODE,
                            width,
                            height
                    );

            ByteArrayOutputStream outputStream =
                    new ByteArrayOutputStream();

            MatrixToImageWriter.writeToStream(
                    matrix,
                    "PNG",
                    outputStream
            );

            return outputStream.toByteArray();

        } catch (Exception e) {

            throw new RuntimeException(
                    "Failed to generate QR code",
                    e
            );
        }
    }
}