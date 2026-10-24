import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Platform,
    Linking,
} from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Download, ChevronLeft, Building2, CheckCircle2, ShieldCheck, Share2 } from 'lucide-react-native';

const PayslipDetail = ({ route, navigation }) => {
    const { payslip } = route.params || {};
    const [downloading, setDownloading] = useState(false);

    if (!payslip) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.centerBox}>
                    <Text style={styles.errorText}>No payslip data found.</Text>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Text style={styles.backBtnText}>‹ Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const formatMoney = (value) => {
        const number = Number(value || 0);
        return number.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const numberToWords = (amount) => {
        const num = Math.floor(Number(amount) || 0);
        if (num === 0) return 'Zero Rupees Only';

        const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
            'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

        const convertLessThanThousand = (n) => {
            let str = '';
            if (n >= 100) {
                str += units[Math.floor(n / 100)] + ' Hundred ';
                n %= 100;
            }
            if (n >= 20) {
                str += tens[Math.floor(n / 10)] + ' ';
                n %= 10;
            }
            if (n > 0) {
                str += units[n] + ' ';
            }
            return str.trim();
        };

        let result = '';
        const crore = Math.floor(num / 10000000);
        let remainder = num % 10000000;
        const lakh = Math.floor(remainder / 100000);
        remainder = remainder % 100000;
        const thousand = Math.floor(remainder / 1000);
        remainder = remainder % 1000;

        if (crore > 0) {
            result += convertLessThanThousand(crore) + ' Crore ';
        }
        if (lakh > 0) {
            result += convertLessThanThousand(lakh) + ' Lakh ';
        }
        if (thousand > 0) {
            result += convertLessThanThousand(thousand) + ' Thousand ';
        }
        if (remainder > 0) {
            result += convertLessThanThousand(remainder) + ' ';
        }

        return (result.trim() + ' Rupees Only');
    };

    const basicPay = Number(payslip.basicPay || 0);
    const allowances = Number(payslip.allowances || 0);
    const deductions = Number(payslip.deductions || 0);
    const grossPay = basicPay + allowances;
    const netPay = Number(payslip.netPay || (grossPay - deductions));
    const empId = `TX-${(payslip.employeeUid || payslip.id || 'EMP').substring(0, 8).toUpperCase()}`;
    const payPeriod = `${payslip.month || 'Current'} ${payslip.year || new Date().getFullYear()}`;
    const amountInWords = numberToWords(netPay);

    const getIssueDate = () => {
        if (payslip.createdAt?.toDate) {
            return payslip.createdAt.toDate().toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            });
        }
        return new Date().toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const handleDownload = async () => {
        if (downloading) return;
        setDownloading(true);

        try {
            const html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="utf-8" />
                <title>Payslip_${(payslip.employeeName || 'Employee').replace(/\\s+/g, '_')}_${payslip.month}_${payslip.year}</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <style>
                    @page {
                        size: A4 portrait;
                        margin: 12mm 15mm;
                    }
                    * {
                        box-sizing: border-box;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    body {
                        font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
                        color: #0f172a;
                        background: #ffffff;
                        margin: 0;
                        padding: 15px;
                        font-size: 13px;
                        line-height: 1.45;
                    }
                    .slip-container {
                        max-width: 780px;
                        margin: 0 auto;
                        border: 2px solid #0f172a;
                        padding: 24px 28px;
                        background: #ffffff;
                    }
                    /* COMPANY HEADER */
                    .header-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 16px;
                    }
                    .header-table td {
                        vertical-align: middle;
                        padding: 0;
                    }
                    .company-name {
                        font-size: 24px;
                        font-weight: 800;
                        color: #0284c7;
                        letter-spacing: 0.5px;
                        margin: 0 0 4px 0;
                        text-transform: uppercase;
                    }
                    .company-tagline {
                        font-size: 12px;
                        color: #475569;
                        font-weight: 600;
                        margin-bottom: 3px;
                    }
                    .company-address {
                        font-size: 11px;
                        color: #64748b;
                    }
                    .header-right {
                        text-align: right;
                    }
                    .doc-badge {
                        display: inline-block;
                        background: #0f172a;
                        color: #ffffff;
                        font-size: 12px;
                        font-weight: 700;
                        padding: 6px 14px;
                        border-radius: 4px;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                    }
                    .period-text {
                        font-size: 14px;
                        font-weight: 700;
                        color: #0284c7;
                        margin-top: 6px;
                    }
                    .divider {
                        border-top: 2px solid #0f172a;
                        margin: 14px 0;
                    }
                    /* EMPLOYEE DETAILS TABLE */
                    .details-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
                        font-size: 12px;
                    }
                    .details-table td {
                        padding: 7px 10px;
                        border: 1px solid #cbd5e1;
                    }
                    .details-table .lbl {
                        background: #f8fafc;
                        color: #475569;
                        font-weight: 600;
                        width: 20%;
                    }
                    .details-table .val {
                        color: #0f172a;
                        font-weight: 600;
                        width: 30%;
                    }
                    /* SALARY BREAKDOWN TABLE */
                    .salary-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
                        font-size: 12.5px;
                    }
                    .salary-table th {
                        background: #0f172a;
                        color: #ffffff;
                        padding: 9px 12px;
                        text-align: left;
                        font-weight: 700;
                        font-size: 12px;
                        letter-spacing: 0.5px;
                        text-transform: uppercase;
                        border: 1px solid #0f172a;
                    }
                    .salary-table th.right {
                        text-align: right;
                    }
                    .salary-table td {
                        padding: 9px 12px;
                        border: 1px solid #cbd5e1;
                    }
                    .salary-table .num {
                        text-align: right;
                        font-weight: 600;
                        font-variant-numeric: tabular-nums;
                    }
                    .salary-table .subtotal-row td {
                        background: #f1f5f9;
                        font-weight: 700;
                        border-top: 2px solid #94a3b8;
                    }
                    /* NET PAY HIGHLIGHT */
                    .net-pay-card {
                        border: 2px solid #0284c7;
                        background: #f0f9ff;
                        padding: 14px 18px;
                        border-radius: 6px;
                        margin-bottom: 22px;
                    }
                    .net-pay-flex {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    .net-pay-title {
                        font-size: 13px;
                        font-weight: 800;
                        color: #0369a1;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    .net-pay-amount {
                        font-size: 24px;
                        font-weight: 900;
                        color: #0284c7;
                        font-variant-numeric: tabular-nums;
                    }
                    .net-words {
                        font-size: 11.5px;
                        font-weight: 600;
                        color: #0f172a;
                        margin-top: 5px;
                        font-style: italic;
                    }
                    /* SIGNATURE & DISCLAIMER */
                    .footer-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 36px;
                    }
                    .footer-table td {
                        vertical-align: bottom;
                        padding: 0;
                    }
                    .disclaimer {
                        font-size: 10.5px;
                        color: #64748b;
                        max-width: 380px;
                        line-height: 1.5;
                    }
                    .signatory-box {
                        text-align: right;
                    }
                    .signatory-company {
                        font-size: 12px;
                        font-weight: 700;
                        color: #0f172a;
                        margin-bottom: 45px;
                    }
                    .signatory-line {
                        font-size: 11.5px;
                        font-weight: 700;
                        color: #334155;
                        border-top: 1.5px dashed #64748b;
                        display: inline-block;
                        padding-top: 5px;
                        min-width: 170px;
                    }
                </style>
            </head>
            <body>
                <div class="slip-container">
                    <!-- HEADER -->
                    <table class="header-table">
                        <tr>
                            <td>
                                <div class="company-name">Tech X IT Services</div>
                                <div class="company-tagline">Software Engineering & Digital Enterprise Solutions</div>
                                <div class="company-address">Bangalore, Karnataka, India | contact@techxitservices.com | www.techxitservices.com</div>
                            </td>
                            <td class="header-right">
                                <div class="doc-badge">Official Payslip</div>
                                <div class="period-text">${payPeriod}</div>
                            </td>
                        </tr>
                    </table>

                    <div class="divider"></div>

                    <!-- EMPLOYEE DETAILS -->
                    <table class="details-table">
                        <tr>
                            <td class="lbl">Employee Name:</td>
                            <td class="val">${payslip.employeeName || 'Staff Member'}</td>
                            <td class="lbl">Employee ID:</td>
                            <td class="val">${empId}</td>
                        </tr>
                        <tr>
                            <td class="lbl">Designation:</td>
                            <td class="val">${payslip.designation || 'Software Engineer'}</td>
                            <td class="lbl">Department:</td>
                            <td class="val">Information Technology</td>
                        </tr>
                        <tr>
                            <td class="lbl">Pay Period:</td>
                            <td class="val">${payPeriod}</td>
                            <td class="lbl">Date of Issue:</td>
                            <td class="val">${getIssueDate()}</td>
                        </tr>
                        <tr>
                            <td class="lbl">Payment Mode:</td>
                            <td class="val">Direct Bank Transfer</td>
                            <td class="lbl">Status:</td>
                            <td class="val" style="color: #16a34a; font-weight: 700;">${(payslip.status || 'ISSUED').toUpperCase()}</td>
                        </tr>
                    </table>

                    <!-- SALARY BREAKDOWN (2 COLUMNS: EARNINGS & DEDUCTIONS) -->
                    <table class="salary-table">
                        <thead>
                            <tr>
                                <th style="width: 32%;">Earnings</th>
                                <th class="right" style="width: 18%;">Amount (₹)</th>
                                <th style="width: 32%;">Deductions</th>
                                <th class="right" style="width: 18%;">Amount (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Basic Pay</td>
                                <td class="num">₹${formatMoney(basicPay)}</td>
                                <td>Provident Fund (PF)</td>
                                <td class="num">₹${formatMoney(deductions)}</td>
                            </tr>
                            <tr>
                                <td>House Rent Allowance (HRA)</td>
                                <td class="num">₹${formatMoney(allowances * 0.6)}</td>
                                <td>Professional Tax</td>
                                <td class="num">₹0.00</td>
                            </tr>
                            <tr>
                                <td>Special Allowance</td>
                                <td class="num">₹${formatMoney(allowances * 0.4)}</td>
                                <td>Income Tax (TDS)</td>
                                <td class="num">₹0.00</td>
                            </tr>
                            <tr>
                                <td>Performance Bonus</td>
                                <td class="num">₹0.00</td>
                                <td>Other Deductions</td>
                                <td class="num">₹0.00</td>
                            </tr>
                            <tr class="subtotal-row">
                                <td>Total Gross Earnings</td>
                                <td class="num">₹${formatMoney(grossPay)}</td>
                                <td>Total Deductions</td>
                                <td class="num">₹${formatMoney(deductions)}</td>
                            </tr>
                        </tbody>
                    </table>

                    <!-- NET SALARY PAYABLE HIGHLIGHT -->
                    <div class="net-pay-card">
                        <div class="net-pay-flex">
                            <span class="net-pay-title">Net Salary Payable</span>
                            <span class="net-pay-amount">₹${formatMoney(netPay)}</span>
                        </div>
                        <div class="net-words">Amount in words: ${amountInWords}</div>
                    </div>

                    <!-- FOOTER & SIGNATORY -->
                    <table class="footer-table">
                        <tr>
                            <td>
                                <div class="disclaimer">
                                    • This is a computer-generated salary slip and does not require a physical signature.<br />
                                    • For any discrepancies or tax inquiries, contact the accounts department at hr@techxitservices.com.
                                </div>
                            </td>
                            <td class="signatory-box">
                                <div class="signatory-company">For Tech X IT Services</div>
                                <div class="signatory-line">Authorized Signatory</div>
                            </td>
                        </tr>
                    </table>
                </div>
            </body>
            </html>
            `;

            // On Web: Render inside hidden iframe and trigger iframe print
            // This guarantees ONLY the corporate payslip is printed without any app screenshot / button artifacts
            if (Platform.OS === 'web') {
                const iframe = document.createElement('iframe');
                iframe.style.position = 'fixed';
                iframe.style.right = '0';
                iframe.style.bottom = '0';
                iframe.style.width = '0';
                iframe.style.height = '0';
                iframe.style.border = '0';
                document.body.appendChild(iframe);

                const iframeDoc = iframe.contentWindow.document;
                iframeDoc.open();
                iframeDoc.write(html);
                iframeDoc.close();

                const safeName = (payslip.employeeName || 'Employee').replace(/\s+/g, '_');
                iframe.contentWindow.document.title = `Payslip_${safeName}_${payslip.month}_${payslip.year}`;

                setTimeout(() => {
                    try {
                        iframe.contentWindow.focus();
                        iframe.contentWindow.print();
                    } catch (err) {
                        console.log('Iframe print error:', err);
                    }
                    setTimeout(() => {
                        try {
                            document.body.removeChild(iframe);
                        } catch (e) {}
                    }, 4000);
                }, 350);

                setDownloading(false);
                return;
            }

            // On Mobile (Android / iOS):
            // Print.printAsync triggers the Android/iOS native "Save as PDF" spooler.
            // On Android, this displays the full A4 payslip preview with the native "Save as PDF"
            // download button saving directly to the phone's Downloads directory.
            try {
                await Print.printAsync({
                    html: html,
                });
            } catch (printErr) {
                console.log('printAsync failed, falling back to file copy & share:', printErr);
                // Fallback: generate file in documentDirectory and share
                const file = await Print.printToFileAsync({ html });
                const safeName = (payslip.employeeName || 'Employee').replace(/\s+/g, '_');
                const cleanName = `Payslip_${safeName}_${payslip.month}_${payslip.year}.pdf`;
                let targetUri = file.uri;
                try {
                    const dest = `${FileSystem.documentDirectory}${cleanName}`;
                    await FileSystem.copyAsync({ from: file.uri, to: dest });
                    targetUri = dest;
                } catch (copyErr) {
                    console.log('Copy error:', copyErr);
                }

                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(targetUri, {
                        mimeType: 'application/pdf',
                        dialogTitle: `Download Payslip - ${cleanName}`,
                        UTI: '.pdf',
                    });
                } else {
                    Alert.alert('Download Complete', `PDF saved to: ${targetUri}`);
                }
            }
        } catch (error) {
            console.log('PDF Generation Error:', error);
            Alert.alert(
                'PDF Generation Failed',
                error?.message || 'Unable to generate official payslip.'
            );
        } finally {
            setDownloading(false);
        }
    };

    const handleShare = async () => {
        if (downloading) return;
        setDownloading(true);

        try {
            const safeName = (payslip.employeeName || 'Employee').replace(/\s+/g, '_');
            const cleanName = `Payslip_${safeName}_${payslip.month}_${payslip.year}.pdf`;

            if (Platform.OS === 'web') {
                if (typeof navigator !== 'undefined' && navigator.share) {
                    try {
                        await navigator.share({
                            title: `Tech X Payslip - ${payslip.employeeName}`,
                            text: `Official Salary Statement for ${payslip.employeeName} (${payslip.month} ${payslip.year}) - Net Pay: ₹${Number(netPay).toLocaleString('en-IN')}`,
                        });
                        setDownloading(false);
                        return;
                    } catch (navErr) {
                        if (navErr.name !== 'AbortError') {
                            console.log('Web share note:', navErr);
                        }
                    }
                }
                // Fallback on web: trigger clean print/download
                handleDownload();
                return;
            }

            // Native mobile (Android & iOS)
            const file = await Print.printToFileAsync({ html });
            const isSharingAvailable = await Sharing.isAvailableAsync();

            if (isSharingAvailable) {
                await Sharing.shareAsync(file.uri, {
                    mimeType: 'application/pdf',
                    dialogTitle: `Share Payslip - ${cleanName}`,
                    UTI: '.pdf',
                });
            } else {
                await Print.printAsync({ uri: file.uri });
            }
        } catch (err) {
            console.log('Share error:', err);
            Alert.alert('Share Error', err?.message || 'Unable to share payslip.');
        } finally {
            setDownloading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Top Bar */}
            <View style={styles.topBar}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                >
                    <ChevronLeft size={20} color="#0f172a" />
                    <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>

                <View style={styles.companyBadge}>
                    <Building2 size={14} color="#0284c7" />
                    <Text style={styles.companyBadgeText}>Tech X IT Services</Text>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
            >
                {/* Header Card */}
                <View style={styles.headerCard}>
                    <View style={styles.headerRow}>
                        <View>
                            <Text style={styles.periodText}>{payPeriod}</Text>
                            <Text style={styles.empNameText}>
                                {payslip.employeeName || 'Staff Member'}
                            </Text>
                            <Text style={styles.empIdText}>ID: {empId}</Text>
                        </View>
                        <View style={styles.statusPill}>
                            <CheckCircle2 size={13} color="#16a34a" />
                            <Text style={styles.statusPillText}>
                                {(payslip.status || 'Issued').toUpperCase()}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Net Pay Hero Card */}
                <View style={styles.netCard}>
                    <Text style={styles.netLabel}>NET SALARY PAYABLE</Text>
                    <Text style={styles.netAmount}>₹{formatMoney(netPay)}</Text>
                    <Text style={styles.netWords}>{amountInWords}</Text>
                </View>

                {/* Tabular Breakdown Card */}
                <View style={styles.detailCard}>
                    <Text style={styles.sectionHeader}>Earnings Breakdown</Text>
                    <View style={styles.rowItem}>
                        <Text style={styles.rowLabel}>Basic Salary</Text>
                        <Text style={styles.rowValue}>₹{formatMoney(basicPay)}</Text>
                    </View>
                    <View style={styles.rowItem}>
                        <Text style={styles.rowLabel}>Allowances & Perks</Text>
                        <Text style={styles.rowValue}>₹{formatMoney(allowances)}</Text>
                    </View>
                    <View style={styles.rowItem}>
                        <Text style={[styles.rowLabel, styles.boldLabel]}>Gross Salary</Text>
                        <Text style={[styles.rowValue, styles.boldValue]}>
                            ₹{formatMoney(grossPay)}
                        </Text>
                    </View>

                    <View style={styles.dividerLine} />

                    <Text style={styles.sectionHeader}>Deductions Breakdown</Text>
                    <View style={styles.rowItem}>
                        <Text style={styles.rowLabel}>Provident Fund (PF) & Tax</Text>
                        <Text style={[styles.rowValue, { color: '#dc2626' }]}>
                            -₹{formatMoney(deductions)}
                        </Text>
                    </View>
                    <View style={styles.rowItem}>
                        <Text style={[styles.rowLabel, styles.boldLabel]}>Total Deductions</Text>
                        <Text style={[styles.rowValue, styles.boldValue, { color: '#dc2626' }]}>
                            -₹{formatMoney(deductions)}
                        </Text>
                    </View>
                </View>

                {/* Trust Seal */}
                <View style={styles.trustBanner}>
                    <ShieldCheck size={18} color="#0284c7" />
                    <Text style={styles.trustBannerText}>
                        Certified Official Payslip for Tech X IT Services
                    </Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionsBox}>
                    <TouchableOpacity
                        style={[styles.downloadBtn, downloading && styles.downloadBtnDisabled]}
                        onPress={handleDownload}
                        disabled={downloading}
                        activeOpacity={0.85}
                    >
                        {downloading ? (
                            <>
                                <ActivityIndicator color="#ffffff" size="small" />
                                <Text style={styles.downloadBtnText}>Processing Official PDF...</Text>
                            </>
                        ) : (
                            <>
                                <Download size={18} color="#ffffff" />
                                <Text style={styles.downloadBtnText}>Download / Save as PDF</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {Platform.OS !== 'web' && (
                        <TouchableOpacity
                            style={[styles.shareBtn, downloading && styles.downloadBtnDisabled]}
                            onPress={handleShare}
                            disabled={downloading}
                            activeOpacity={0.85}
                        >
                            <Share2 size={18} color="#0284c7" />
                            <Text style={styles.shareBtnText}>Share (WhatsApp / Drive)</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default PayslipDetail;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderRadius: 8,
        backgroundColor: '#f1f5f9',
    },
    backButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0f172a',
        marginLeft: 2,
    },
    companyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#f0f9ff',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#bae6fd',
    },
    companyBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#0284c7',
    },
    container: {
        padding: 16,
        paddingBottom: 40,
    },
    headerCard: {
        backgroundColor: '#ffffff',
        borderRadius: 14,
        padding: 18,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 14,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    periodText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#0284c7',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    empNameText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0f172a',
        marginTop: 2,
    },
    empIdText: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#dcfce7',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    statusPillText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#15803d',
    },
    netCard: {
        backgroundColor: '#0284c7',
        borderRadius: 14,
        padding: 20,
        marginBottom: 14,
        shadowColor: '#0284c7',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 3,
    },
    netLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#e0f2fe',
        letterSpacing: 1,
    },
    netAmount: {
        fontSize: 30,
        fontWeight: '900',
        color: '#ffffff',
        marginTop: 4,
    },
    netWords: {
        fontSize: 12,
        color: '#e0f2fe',
        fontStyle: 'italic',
        marginTop: 6,
    },
    detailCard: {
        backgroundColor: '#ffffff',
        borderRadius: 14,
        padding: 18,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 14,
    },
    sectionHeader: {
        fontSize: 13,
        fontWeight: '800',
        color: '#475569',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 10,
    },
    rowItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    rowLabel: {
        fontSize: 14,
        color: '#475569',
    },
    rowValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0f172a',
    },
    boldLabel: {
        fontWeight: '700',
        color: '#0f172a',
    },
    boldValue: {
        fontWeight: '800',
        fontSize: 15,
    },
    dividerLine: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginVertical: 12,
    },
    trustBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#f0f9ff',
        paddingVertical: 10,
        borderRadius: 10,
        marginBottom: 16,
    },
    trustBannerText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#0369a1',
    },
    actionsBox: {
        gap: 12,
        marginTop: 6,
    },
    downloadBtn: {
        backgroundColor: '#0f172a',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 3,
    },
    downloadBtnDisabled: {
        opacity: 0.7,
    },
    downloadBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#ffffff',
    },
    shareBtn: {
        backgroundColor: '#f0f9ff',
        borderWidth: 1.5,
        borderColor: '#0284c7',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    shareBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0284c7',
    },
    centerBox: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#64748b',
        marginBottom: 16,
    },
    backBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#0284c7',
        borderRadius: 8,
    },
    backBtnText: {
        color: '#ffffff',
        fontWeight: '700',
    },
});