import MainLayout from "@/components/layout/MainLayout";

export default function PaymentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <MainLayout>
            {children}
        </MainLayout>
    );
}
