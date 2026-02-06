import MainLayout from "@/components/layout/MainLayout";

export default function AccountLayout({
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
