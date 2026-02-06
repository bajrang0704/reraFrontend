"use client";

import { Box, Typography, Paper } from "@mui/material";

export default function AuditReportPage() {
    return (
        <Box>
            <Typography variant="h5" fontWeight="bold" mb={3}>Annual Audit Report</Typography>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="textSecondary">Annual Audit Report submission form will be implemented here.</Typography>
            </Paper>
        </Box>
    );
}
