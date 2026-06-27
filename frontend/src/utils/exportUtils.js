import * as XLSX from 'xlsx';

export const exportExcel = (data, filename = "transaction") => {
    if (!data || data.length === 0) {
        alert("No data to export.");
        return;
    }

    try {
        const worksheet = XLSX.utils.json_to_sheet(data);
        // create a workbook
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');

        // Generate a excel file and trigger download
        XLSX.writeFile(workbook, `${filename}.xlsx`, {
            bookType: 'xlsx',
            type: 'array'
        });
    }
    
    catch (error) {
        console.error("Exxport Error: ", error);
        alert("Error exporting data. Please try again.");
    }
}