"use client";

import { Box, Typography, Paper } from "@mui/material";

export default function PaymentReceiptsPage() {
    return (
        <Box>
            <Typography variant="h5" fontWeight="bold" mb={3}>Download Payment Receipts</Typography>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="textSecondary">Download payment receipts list will be implemented here.</Typography>
            </Paper>
        </Box>
    );
}
