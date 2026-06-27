import expenseModel from "../models/expenseModel.js";
import getDateRange from "../utils/dateFilter.js";
import XLSX from "xlsx";

// add expense
export async function addExpense(req, res) {
    const userId = req.user.id;
    const { description, amount, category, date } = req.body;

    try {
        if (!description || !amount || !category || !date) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        const newExpense = new expenseModel({
            userId,
            description,
            amount,
            category,
            date: new Date(date)
        });

        await newExpense.save();

        res.json({
            success: true,
            message: "Expense added successfully",
        });
    }

    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}

// to get all expenses
export async function getAllExpense(req, res) {
    const userId = req.user.id;

    try {
        const expense = await expenseModel.find({ userId }).sort({ createdAt: -1 });
        res.json(expense);
    }

    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}

// update expense
export async function updateExpense(req, res) {
    const { id } = req.params;
    const userId = req.user.id;
    const { description, amount, category, date } = req.body;

    try {
        const updatedExpense = await expenseModel.findOneAndUpdate(
            { _id: id, userId },
            { description, amount, category, date },
            { new: true }
        );

        if (!updatedExpense) {
            return res.status(404).json({
                success: false,
                message: "Expense not found"
            });
        }

        res.json({
            success: true,
            message: "Expense updated successfully",
            data: updatedExpense
        });
    }

    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}

// delete expense
export async function deleteExpense(req, res) {
    try {
        const expense = await expenseModel.findByIdAndDelete(req.params.id);

        if (!expense) {
            return res.status(404).json({
                success: false,
                message: "Expense not found"
            });
        }

        return res.json({
            success: true,
            message: "Expense deleted successfully"
        });
    }

    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}

// download excel
export async function downloadExpenseExcel(req, res) {
    const userId = req.user.id;

    try {
        const expense = await expenseModel.find({ userId }).sort({ createdAt: -1 });

        const plainData = expense.map((exp) => ({
            description: exp.description,
            amount: exp.amount,
            category: exp.category,
            date: new Date(exp.date).toLocaleDateString(),
        }));

        const worksheet = XLSX.utils.json_to_sheet(plainData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");

        const filePath = "./expense_details.xlsx";
        XLSX.writeFile(workbook, filePath);

        res.download(filePath);
    }

    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}

// overview
export async function getExpenseOverview(req, res) {
    try {
        const userId = req.user.id;
        const { range = "monthly" } = req.query;
        const { start, end } = getDateRange(range);

        const expense = await expenseModel.find({
            userId,
            date: { $gte: start, $lte: end }
        }).sort({ date: -1 });

        const totalExpense = expense.reduce((acc, cur) => acc + Number(cur.amount || 0), 0);
        const averageExpense = expense.length > 0 ? totalExpense / expense.length : 0;
        const numberOfTransactions = expense.length;
        const recentTransactions = expense.slice(0, 5);

        res.json({
            success: true,
            data: {
                totalExpense,
                averageExpense,
                numberOfTransactions,
                recentTransactions,
                range
            }
        });
    }

    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}