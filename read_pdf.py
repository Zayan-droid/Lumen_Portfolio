import PyPDF2

def read_pdf(file_path):
    try:
        with open(file_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n--- PAGE BREAK ---\n"
            print(text)
    except Exception as e:
        print(f"Error reading PDF: {e}")

read_pdf("d:/lumen/Lumen_Product_Proposal.pdf")
