import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    Platform,
    Alert,
    ActivityIndicator,
} from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Download, Share2, CheckCircle2, Clock, Building2 } from 'lucide-react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

const COMPANY = {
    name: 'Tech X IT Services',
    legalName: 'TECH X IT SERVICES PRIVATE LIMITED',
    tagline: 'Enterprise Software & Digital Growth Solutions',
    address: 'Core Tech Tower, Sector 62, Noida, Uttar Pradesh, India - 201309',
    email: 'techxitservices65@gmail.com',
    phone: '+91 98765 43210',
    website: 'www.techxitservices.com',
    gstin: '09AABCT1234F1Z8',
    pan: 'AABCT1234F',
};

const numberToWords = (num) => {
    const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
        'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const n = Math.floor(Number(num) || 0);
    if (n === 0) return 'Zero';

    const convert = (val) => {
        if (val < 20) return a[val];
        if (val < 100) return b[Math.floor(val / 10)] + (val % 10 ? ' ' + a[val % 10] : '');
        if (val < 1000) return a[Math.floor(val / 100)] + ' Hundred' + (val % 100 ? ' and ' + convert(val % 100) : '');
        if (val < 100000) return convert(Math.floor(val / 1000)) + ' Thousand' + (val % 1000 ? ' ' + convert(val % 1000) : '');
        if (val < 10000000) return convert(Math.floor(val / 100000)) + ' Lakh' + (val % 100000 ? ' ' + convert(val % 100000) : '');
        return convert(Math.floor(val / 10000000)) + ' Crore' + (val % 10000000 ? ' ' + convert(val % 10000000) : '');
    };

    return 'Rupees ' + convert(n) + ' Only';
};

const buildInvoiceHtml = (invoice) => {
    const subtotal = Number(invoice.subtotal || invoice.amount || 0);
    const taxRate = Number(invoice.taxRate || 0);
    const taxAmount = Number(invoice.taxAmount || (subtotal * taxRate / 100));
    const grandTotal = Number(invoice.totalAmount || (subtotal + taxAmount));
    const totalInWords = numberToWords(grandTotal);

    const isPaid = invoice.status?.toLowerCase() === 'paid';
    const statusBg = isPaid ? '#dcfce7' : '#fef3c7';
    const statusColor = isPaid ? '#15803d' : '#b45309';
    const statusText = isPaid ? 'PAID' : 'PAYMENT PENDING';

    const items = invoice.items && invoice.items.length > 0
        ? invoice.items
        : [{ description: invoice.description || invoice.projectTitle || 'Software Milestone Deliverable', amount: subtotal }];

    const itemsRows = items.map((it, idx) => `
        <tr>
            <td style="text-align: center; padding: 12px 10px; border-bottom: 1px solid #e2e8f0; color: #475569;">${idx + 1}</td>
            <td style="padding: 12px 14px; border-bottom: 1px solid #e2e8f0;">
                <div style="font-weight: 700; color: #0f172a; font-size: 13px;">${it.description || 'Project Milestone'}</div>
                <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Deliverable verified & certified by Tech X IT Services</div>
            </td>
            <td style="text-align: center; padding: 12px 10px; border-bottom: 1px solid #e2e8f0; color: #475569;">1</td>
            <td style="text-align: right; padding: 12px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #0f172a;">₹${Number(it.amount || 0).toLocaleString('en-IN')}</td>
            <td style="text-align: right; padding: 12px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #0284c7;">₹${Number(it.amount || 0).toLocaleString('en-IN')}</td>
        </tr>
    `).join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Invoice - ${invoice.invoiceNumber || 'TX-INV'}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm 12mm 12mm 12mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      padding: 24px;
      font-size: 12px;
      line-height: 1.4;
    }
    .sheet {
      max-width: 800px;
      margin: 0 auto;
      border: 1.5px solid #0284c7;
      border-radius: 12px;
      overflow: hidden;
      background: #ffffff;
    }
    .header-bar {
      background: linear-gradient(135deg, #0369a1 0%, #0284c7 60%, #38bdf8 100%);
      color: #ffffff;
      padding: 22px 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 900;
      letter-spacing: -0.5px;
    }
    .brand-accent { color: #fef08a; }
    .brand-sub {
      font-size: 10px;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      opacity: 0.9;
      margin-top: 2px;
    }
    .header-right {
      text-align: right;
    }
    .invoice-title {
      font-size: 20px;
      font-weight: 900;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .invoice-num {
      font-size: 13px;
      font-weight: 700;
      color: #fef08a;
      margin-top: 4px;
    }
    .meta-band {
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      padding: 16px 28px;
      display: flex;
      justify-content: space-between;
    }
    .meta-col { flex: 1; }
    .meta-label { font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .meta-val { font-size: 12px; font-weight: 700; color: #0f172a; }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.5px;
      background: ${statusBg};
      color: ${statusColor};
      border: 1px solid ${statusColor};
      margin-top: 4px;
    }
    .parties-row {
      display: flex;
      padding: 20px 28px;
      gap: 30px;
      border-bottom: 1px solid #e2e8f0;
    }
    .party-box { flex: 1; }
    .party-heading {
      font-size: 10.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #0284c7;
      margin-bottom: 8px;
      border-bottom: 1px solid #bae6fd;
      padding-bottom: 4px;
    }
    .party-name { font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 3px; }
    .party-detail { font-size: 11px; color: #475569; line-height: 1.5; }
    .table-container { padding: 16px 28px; }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #f1f5f9; }
    th {
      padding: 10px 12px;
      font-size: 10.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #475569;
      border-bottom: 2px solid #cbd5e1;
    }
    .calc-row {
      display: flex;
      justify-content: flex-end;
      padding: 12px 28px 20px 28px;
    }
    .calc-box {
      width: 280px;
    }
    .calc-line {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 12px;
      color: #475569;
    }
    .calc-line.total {
      border-top: 2px solid #0f172a;
      margin-top: 6px;
      padding-top: 10px;
      font-size: 15px;
      font-weight: 900;
      color: #0284c7;
    }
    .words-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      padding: 12px 28px;
      margin: 0 28px 16px 28px;
      border-radius: 8px;
    }
    .words-label { font-size: 9.5px; font-weight: 800; text-transform: uppercase; color: #166534; }
    .words-val { font-size: 12px; font-weight: 700; color: #14532d; margin-top: 2px; }
    .footer-section {
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 20px 28px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .bank-details { flex: 1; }
    .bank-title { font-size: 10.5px; font-weight: 800; text-transform: uppercase; color: #0284c7; margin-bottom: 6px; }
    .bank-line { font-size: 11px; color: #475569; margin-bottom: 2px; }
    .sign-box { text-align: center; width: 220px; }
    .sign-line { border-bottom: 1.5px dashed #94a3b8; height: 45px; margin-bottom: 6px; }
    .sign-title { font-size: 11px; font-weight: 800; color: #0f172a; }
    .sign-company { font-size: 9.5px; color: #64748b; }
    .disclaimer {
      text-align: center;
      padding: 10px 28px;
      font-size: 9px;
      color: #94a3b8;
      border-top: 1px solid #f1f5f9;
    }
  </style>
</head>
<body>
  <div class="sheet">
    <!-- Header -->
    <div class="header-bar">
      <div>
        <div class="brand-title">Tech<span class="brand-accent">X</span> IT Services</div>
        <div class="brand-sub">${COMPANY.legalName}</div>
      </div>
      <div class="header-right">
        <div class="invoice-title">TAX INVOICE</div>
        <div class="invoice-num">${invoice.invoiceNumber || 'TX-INV-2026-001'}</div>
      </div>
    </div>

    <!-- Meta Band -->
    <div class="meta-band">
      <div class="meta-col">
        <div class="meta-label">Invoice Date</div>
        <div class="meta-val">${invoice.invoiceDate || '12 Sep 2026'}</div>
      </div>
      <div class="meta-col">
        <div class="meta-label">Payment Due Date</div>
        <div class="meta-val">${invoice.dueDate || '27 Sep 2026'}</div>
      </div>
      <div class="meta-col">
        <div class="meta-label">Project / Service</div>
        <div class="meta-val">${invoice.projectTitle || 'Software Project'}</div>
      </div>
      <div class="meta-col" style="text-align: right;">
        <div class="meta-label">Status</div>
        <div class="status-badge">${statusText}</div>
      </div>
    </div>

    <!-- Parties -->
    <div class="parties-row">
      <div class="party-box">
        <div class="party-heading">Billed By (Provider)</div>
        <div class="party-name">${COMPANY.legalName}</div>
        <div class="party-detail">${COMPANY.address}</div>
        <div class="party-detail">Email: ${COMPANY.email} | Tel: ${COMPANY.phone}</div>
        <div class="party-detail">GSTIN: ${COMPANY.gstin} | PAN: ${COMPANY.pan}</div>
      </div>
      <div class="party-box">
        <div class="party-heading">Billed To (Client)</div>
        <div class="party-name">${invoice.clientName || 'Valued Client'}</div>
        <div class="party-detail">Email: ${invoice.clientEmail || 'N/A'}</div>
        <div class="party-detail">Project: ${invoice.projectTitle || 'Custom Solution'}</div>
        <div class="party-detail">Client UID: ${invoice.clientUid ? invoice.clientUid.slice(0, 14) + '...' : 'Registered Client'}</div>
      </div>
    </div>

    <!-- Line Items Table -->
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th style="width: 40px; text-align: center;">#</th>
            <th style="text-align: left;">Milestone / Item Description</th>
            <th style="width: 60px; text-align: center;">Qty</th>
            <th style="width: 110px; text-align: right;">Rate (₹)</th>
            <th style="width: 120px; text-align: right;">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>
    </div>

    <!-- Calculation Totals -->
    <div class="calc-row">
      <div class="calc-box">
        <div class="calc-line">
          <span>Subtotal:</span>
          <span style="font-weight: 700; color: #0f172a;">₹${subtotal.toLocaleString('en-IN')}</span>
        </div>
        ${taxRate > 0 ? `
        <div class="calc-line">
          <span>GST / Tax (${taxRate}%):</span>
          <span>₹${taxAmount.toLocaleString('en-IN')}</span>
        </div>` : ''}
        <div class="calc-line total">
          <span>Total Amount Payable:</span>
          <span>₹${grandTotal.toLocaleString('en-IN')}</span>
        </div>
      </div>
    </div>

    <!-- Amount in words -->
    <div class="words-box">
      <div class="words-label">Amount in Words</div>
      <div class="words-val">${totalInWords}</div>
    </div>

    <!-- Footer Bank Details & Signature -->
    <div class="footer-section">
      <div class="bank-details">
        <div class="bank-title">Payment & Banking Details</div>
        <div class="bank-line"><b>Beneficiary Name:</b> TECH X IT SERVICES PVT LTD</div>
        <div class="bank-line"><b>Bank Name:</b> HDFC Bank, Sector 62 Branch</div>
        <div class="bank-line"><b>A/C No:</b> 50200088991122</div>
        <div class="bank-line"><b>IFSC Code:</b> HDFC0001234</div>
        <div class="bank-line"><b>UPI ID:</b> techxitservices@hdfcbank</div>
      </div>
      <div class="sign-box">
        <div class="sign-line"></div>
        <div class="sign-title">Authorized Signatory</div>
        <div class="sign-company">Tech X IT Services Pvt Ltd</div>
      </div>
    </div>

    <div class="disclaimer">
      This is a system-generated computer Tax Invoice. Standard warranties apply per formal service agreement.
    </div>
  </div>
</body>
</html>
    `;
};

const InvoiceDetail = ({ route, navigation }) => {
    const { invoice } = route.params || {};
    const [downloading, setDownloading] = useState(false);

    if (!invoice) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.centerBox}>
                    <Text style={styles.errorText}>Invoice data not found.</Text>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Text style={styles.backBtnText}>‹ Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const grandTotal = Number(invoice.totalAmount || invoice.amount || 0);
    const isPaid = invoice.status?.toLowerCase() === 'paid';

    const handleDownloadPdf = async () => {
        setDownloading(true);
        try {
            const html = buildInvoiceHtml(invoice);

            if (Platform.OS === 'web') {
                const printFrame = document.createElement('iframe');
                printFrame.style.position = 'fixed';
                printFrame.style.right = '0';
                printFrame.style.bottom = '0';
                printFrame.style.width = '0';
                printFrame.style.height = '0';
                printFrame.style.border = '0';
                document.body.appendChild(printFrame);

                const frameDoc = printFrame.contentWindow || printFrame.contentDocument.document || printFrame.contentDocument;
                frameDoc.document.open();
                frameDoc.document.write(html);
                frameDoc.document.close();

                setTimeout(() => {
                    frameDoc.focus();
                    frameDoc.print();
                    setTimeout(() => {
                        document.body.removeChild(printFrame);
                    }, 1000);
                }, 500);
                return;
            }

            // Mobile Native (Android / iOS)
            await Print.printAsync({
                html,
                orientation: Print.Orientation.portrait,
            });
        } catch (error) {
            console.log('Invoice PDF download error:', error);
            Alert.alert('Download Error', 'Could not generate PDF: ' + error.message);
        } finally {
            setDownloading(false);
        }
    };

    const handleSharePdf = async () => {
        if (Platform.OS === 'web') {
            if (typeof navigator !== 'undefined' && navigator.share) {
                try {
                    await navigator.share({
                        title: `Invoice ${invoice.invoiceNumber}`,
                        text: `Tech X Invoice ${invoice.invoiceNumber} for ${invoice.projectTitle} - Amount: ₹${Number(invoice.totalAmount || 0).toLocaleString('en-IN')}`,
                    });
                    return;
                } catch (navErr) {
                    if (navErr.name !== 'AbortError') {
                        console.log('Web share note:', navErr);
                    }
                }
            }
            handleDownloadPdf();
            return;
        }

        setDownloading(true);
        try {
            const html = buildInvoiceHtml(invoice);
            const { uri } = await Print.printToFileAsync({ html });

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, {
                    UTI: '.pdf',
                    mimeType: 'application/pdf',
                    dialogTitle: `Share Invoice ${invoice.invoiceNumber}`,
                });
            } else {
                await Print.printAsync({ uri });
            }
        } catch (error) {
            console.log('Share invoice error:', error);
            Alert.alert('Share Error', error.message);
        } finally {
            setDownloading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            {/* Top Bar */}
            <View style={styles.topBar}>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                >
                    <ArrowLeft size={20} color="#0f172a" />
                    <Text style={styles.backBtnText}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.topBarTitle}>Invoice Details</Text>
                <View style={{ width: 60 }} />
            </View>

            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                {/* Header Card */}
                <View style={styles.headerCard}>
                    <View style={styles.headerTop}>
                        <View>
                            <Text style={styles.invoiceNumberText}>{invoice.invoiceNumber || 'TX-INV-2026'}</Text>
                            <Text style={styles.projectNameText}>{invoice.projectTitle || 'Software Project'}</Text>
                        </View>
                        <View style={[styles.statusPill, isPaid ? styles.statusPaid : styles.statusPending]}>
                            {isPaid ? <CheckCircle2 size={13} color="#15803d" /> : <Clock size={13} color="#b45309" />}
                            <Text style={[styles.statusPillText, isPaid ? styles.statusPaidText : styles.statusPendingText]}>
                                {isPaid ? 'PAID' : 'PENDING'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.amountDivider} />

                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Grand Total</Text>
                        <Text style={styles.totalAmount}>₹{grandTotal.toLocaleString('en-IN')}</Text>
                    </View>
                </View>

                {/* Client & Project Details Card */}
                <View style={styles.detailCard}>
                    <Text style={styles.sectionHeading}>Client & Billing Info</Text>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Client Name</Text>
                        <Text style={styles.infoVal}>{invoice.clientName || 'N/A'}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Client Email</Text>
                        <Text style={styles.infoVal}>{invoice.clientEmail || 'N/A'}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Invoice Date</Text>
                        <Text style={styles.infoVal}>{invoice.invoiceDate || 'N/A'}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Due Date</Text>
                        <Text style={styles.infoVal}>{invoice.dueDate || 'N/A'}</Text>
                    </View>

                    {invoice.notes ? (
                        <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                            <Text style={styles.infoLabel}>Terms / Notes</Text>
                            <Text style={[styles.infoVal, { flex: 1, textAlign: 'right' }]}>{invoice.notes}</Text>
                        </View>
                    ) : null}
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtonsWrap}>
                    <TouchableOpacity
                        style={styles.downloadBtn}
                        onPress={handleDownloadPdf}
                        activeOpacity={0.88}
                        disabled={downloading}
                    >
                        {downloading ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                            <>
                                <Download size={18} color="#ffffff" />
                                <Text style={styles.downloadBtnText}>
                                    {Platform.OS === 'web' ? 'Print / Save as PDF' : 'Download Invoice PDF'}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.shareBtn}
                        onPress={handleSharePdf}
                        activeOpacity={0.88}
                        disabled={downloading}
                    >
                        <Share2 size={18} color="#0284c7" />
                        <Text style={styles.shareBtnText}>Share via WhatsApp / Drive</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default InvoiceDetail;

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
        borderBottomColor: '#f1f5f9',
    },
    topBarTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#0f172a',
    },
    backBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 6,
        paddingHorizontal: 10,
        backgroundColor: '#f1f5f9',
        borderRadius: 8,
    },
    backBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0f172a',
    },
    container: {
        padding: 16,
        gap: 16,
    },
    headerCard: {
        backgroundColor: '#ffffff',
        borderRadius: 18,
        padding: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    invoiceNumberText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0f172a',
        letterSpacing: -0.3,
    },
    projectNameText: {
        fontSize: 13,
        color: '#64748b',
        fontWeight: '600',
        marginTop: 2,
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusPaid: {
        backgroundColor: '#dcfce7',
    },
    statusPending: {
        backgroundColor: '#fef3c7',
    },
    statusPillText: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.4,
    },
    statusPaidText: {
        color: '#15803d',
    },
    statusPendingText: {
        color: '#b45309',
    },
    amountDivider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginVertical: 16,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
    },
    totalAmount: {
        fontSize: 26,
        fontWeight: '900',
        color: '#0284c7',
        letterSpacing: -0.5,
    },
    detailCard: {
        backgroundColor: '#ffffff',
        borderRadius: 18,
        padding: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        gap: 12,
    },
    sectionHeading: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 4,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f8fafc',
    },
    infoLabel: {
        fontSize: 13,
        color: '#64748b',
        fontWeight: '500',
    },
    infoVal: {
        fontSize: 13,
        fontWeight: '700',
        color: '#0f172a',
    },
    actionButtonsWrap: {
        gap: 12,
        marginTop: 8,
        marginBottom: 30,
    },
    downloadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#0284c7',
        paddingVertical: 15,
        borderRadius: 14,
        shadowColor: '#0284c7',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    downloadBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#ffffff',
    },
    shareBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#f0f9ff',
        borderWidth: 1,
        borderColor: '#bae6fd',
        paddingVertical: 14,
        borderRadius: 14,
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
        fontSize: 15,
        color: '#dc2626',
        fontWeight: '600',
        marginBottom: 16,
    },
});
