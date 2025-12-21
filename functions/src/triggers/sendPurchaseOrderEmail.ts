import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Resend } from 'resend';

// Initialize Resend with API Key from environment variables
const resend = new Resend(process.env.RESEND_API_KEY || 're_123456789'); // Valid placeholder or env var

export const sendPurchaseOrderEmail = functions.firestore
    .document('purchaseOrders/{orderId}')
    .onUpdate(async (change, context) => {
        const newData = change.after.data();
        const previousData = change.before.data();

        // Only trigger when status changes to ORDERED
        if (newData.status === 'ORDERED' && previousData.status !== 'ORDERED') {
            console.log(`Processing order ${context.params.orderId} - Status changed to ORDERED`);

            try {
                // 1. Fetch Supplier Details
                const supplierDoc = await admin.firestore().collection('suppliers').doc(newData.supplierId).get();
                const supplier = supplierDoc.data();

                if (!supplier || !supplier.email) {
                    console.error('Supplier not found or has no email');
                    return;
                }

                // 2. Fetch Outlet Details (for sender info)
                const outletDoc = await admin.firestore().collection('outlets').doc(newData.outletId).get();
                const outlet = outletDoc.data();
                const branchName = outlet?.name || 'ChefOS Kitchen';

                // 3. Generate HTML Table for Items
                const itemsHtml = newData.items.map((item: any) => `
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.tempDescription || 'Ingrediente ' + item.ingredientId}</td>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.quantity} ${item.unit}</td>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.costPerUnit}€</td>
                    </tr>
                `).join('');

                const emailHtml = `
                    <div style="font-family: Arial, sans-serif; color: #333;">
                        <h2>Nuevo Pedido: ${newData.orderNumber}</h2>
                        <p>Hola <strong>${supplier.name}</strong>,</p>
                        <p>Por favor, procese el siguiente pedido para <strong>${branchName}</strong>.</p>
                        
                        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                            <thead>
                                <tr style="background-color: #f4f4f4;">
                                    <th style="padding: 10px; text-align: left;">Producto</th>
                                    <th style="padding: 10px; text-align: left;">Cantidad</th>
                                    <th style="padding: 10px; text-align: left;">Precio Unit. Estimado</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsHtml}
                            </tbody>
                        </table>

                        <p style="margin-top: 20px;">
                            <strong>Fecha de Entrega Deseada:</strong> ${newData.deliveryDate || 'Lo antes posible'}<br>
                            <strong>Notas:</strong> ${newData.notes || 'N/A'}
                        </p>

                        <hr style="margin: 20px 0; border: 0; border-top: 1px solid #eee;">
                        <p style="font-size: 12px; color: #888;">Este pedido fue generado automáticamente por ChefOS.</p>
                    </div>
                `;

                // 4. Send Email via Resend
                // Make sure to configure sender domain in Resend dashboard
                await resend.emails.send({
                    from: 'Pedidos ChefOS <orders@chefos.app>',
                    to: supplier.email,
                    subject: `Pedido ${newData.orderNumber} - ${branchName}`,
                    html: emailHtml
                });

                console.log(`Email sent to ${supplier.email} for order ${newData.orderNumber}`);

                // 5. Update Order with sentAt timestamp
                await change.after.ref.update({
                    sentAt: new Date().toISOString()
                });

            } catch (error) {
                console.error('Error sending email:', error);
            }
        }
    });
