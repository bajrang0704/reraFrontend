"use client";

import { use } from "react";
import { Box, Typography, Paper } from "@mui/material";

export default function WithdrawalPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    return (
        <Box>
            <Typography variant="h5" fontWeight="bold" mb={3}>Application Withdrawal</Typography>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="textSecondary">Application withdrawal functionality will be implemented here.</Typography>
                <Typography variant="caption">Project ID: {decodeURIComponent(id)}</Typography>
            </Paper>
        </Box>
    );
}
