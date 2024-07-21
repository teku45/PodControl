#!/usr/bin/env python3

import argparse
import zlib
import os
import zipfile
from io import BytesIO
import base64
from PyPDF2 import PdfReader, PdfWriter

def zip_and_compress_data(path):
    zip_buffer = BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        if os.path.isfile(path):
            zip_file.write(path, os.path.basename(path))
        elif os.path.isdir(path):
            for root, _, files in os.walk(path):
                for file in files:
                    file_path = os.path.join(root, file)
                    arcname = os.path.relpath(file_path, path)
                    zip_file.write(file_path, arcname)
    
    zip_data = zip_buffer.getvalue()
    compressed_data = zlib.compress(zip_data)
    return compressed_data

def get_default_output_name(input_path):
    base, _ = os.path.splitext(input_path)
    return f"{base}_encoded.pdf"

def encode_data(pdf_path, data_path, output_path=None):
    compressed_data = zip_and_compress_data(data_path)
    
    print(f"Original data size: {os.path.getsize(data_path) if os.path.isfile(data_path) else sum(os.path.getsize(os.path.join(root, file)) for root, _, files in os.walk(data_path) for file in files)} bytes")
    print(f"Compressed data size: {len(compressed_data)} bytes")

    secret = base64.b64encode(compressed_data).decode()

    reader = PdfReader(pdf_path)
    writer = PdfWriter()

    for page in reader.pages:
        writer.add_page(page)

    writer.add_metadata({
        '/Secret': secret
    })

    if output_path is None:
        output_path = get_default_output_name(pdf_path)
    
    with open(output_path, 'wb') as output_file:
        writer.write(output_file)
    
    print(f"Data encoded and saved to {output_path}")
    print(f"First 20 characters of encoded data: {secret[:20]}")

def decode_data(pdf_path, output_path):
    reader = PdfReader(pdf_path)
    metadata = reader.metadata

    if '/Secret' not in metadata:
        raise ValueError("No encoded data found in the PDF.")

    secret = metadata['/Secret']
    
    print(f"Type of revealed data: {type(secret)}")
    print(f"Length of revealed data: {len(secret)}")
    print(f"First 20 characters of revealed data: {secret[:20]}")

    try:
        compressed_data = base64.b64decode(secret)
        print(f"Compressed data size: {len(compressed_data)} bytes")
        print(f"First 20 bytes of compressed data: {compressed_data[:20]}")

        decompressed_data = zlib.decompress(compressed_data)
        print(f"Decompressed data size: {len(decompressed_data)} bytes")

        with zipfile.ZipFile(BytesIO(decompressed_data)) as zip_file:
            zip_file.extractall(output_path)
        print(f"Data successfully extracted and saved to {output_path}")
    except ValueError as e:
        print(f"Error: Failed to convert revealed data to bytes. {str(e)}")
    except zlib.error as e:
        print(f"Error: Failed to decompress data. {str(e)}")
        print(f"First 50 bytes of compressed data: {compressed_data[:50].hex()}")
    except zipfile.BadZipFile as e:
        print(f"Error: Failed to extract zip file. {str(e)}")
    except Exception as e:
        print(f"Unexpected error: {str(e)}")

def main():
    parser = argparse.ArgumentParser(description='PDF Steganography Tool')
    subparsers = parser.add_subparsers(dest='command', help='Available commands')

    encode_parser = subparsers.add_parser('encode', help='Encode data into a PDF')
    encode_parser.add_argument('--pdf', required=True, help='Path to the input PDF file')
    encode_parser.add_argument('--data', required=True, help='Path to the data file or directory to be hidden')
    encode_parser.add_argument('--output', help='Path to the output PDF file (optional)')

    decode_parser = subparsers.add_parser('decode', help='Decode data from a PDF')
    decode_parser.add_argument('--pdf', required=True, help='Path to the input PDF file')
    decode_parser.add_argument('--output', required=True, help='Path to the output data directory')

    args = parser.parse_args()

    if args.command == 'encode':
        encode_data(args.pdf, args.data, args.output)
    elif args.command == 'decode':
        decode_data(args.pdf, args.output)
    else:
        parser.print_help()

if __name__ == '__main__':
    main()