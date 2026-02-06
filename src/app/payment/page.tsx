"use client";

import { Box, Typography, Paper } from "@mui/material";

export default function PaymentPage() {
    return (
        <Box>
            <Typography variant="h5" fontWeight="bold" mb={3}>Payment</Typography>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="textSecondary">Payment processing page will be implemented here.</Typography>
            </Paper>
        </Box>
    );
}
