import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    vus: 6,
    iterations: 6,
};

const BASE_URL = 'http://localhost:8080';

const KITCHEN_TOKEN = __ENV.KITCHEN_TOKEN;
const WAITER_TOKEN = __ENV.WAITER_TOKEN;
const CASHIER_TOKEN = __ENV.CASHIER_TOKEN;

const TABLES = [
    {
        name: 'T01',
        qrToken: 'e2adf520-e681-4c94-a7de-370c7827a8d6',
        sessionCode: '9760',
    },
    {
        name: 'T02',
        qrToken: '273fd540-a88e-41ab-aef5-239662231112',
        sessionCode: '1201',
    },
    {
        name: 'T03',
        qrToken: 'b9408165-5b3c-4103-99f0-6805e670b6d4',
        sessionCode: '1204',
    },
    {
        name: 'T04',
        qrToken: '965e9649-9269-4d88-ba60-1df14845ce20',
        sessionCode: '1205',
    },
    {
        name: 'T05',
        qrToken: '25a02c14-2dc7-4872-83fa-65efac2c166a',
        sessionCode: '1203',
    },
    {
        name: 'T06',
        qrToken: 'efba6696-b0ff-4b16-a30d-b8680bebc052',
        sessionCode: '1206',
    },
];

export default function () {

    const table = TABLES[__VU - 1];

    console.log(`VU ${__VU} → ${table.name}`);

    // =====================================================
    // 1. CREATE ORDER
    // =====================================================

    const orderPayload = JSON.stringify({
        qrToken: table.qrToken,
        sessionCode: table.sessionCode,
        items: [
            {
                menuItemId: 2,
                quantity: 2,
            },
        ],
    });

    const orderResponse = http.post(
        `${BASE_URL}/api/orders`,
        orderPayload,
        {
            headers: {
                'Content-Type': 'application/json',
            },
        }
    );

    const orderCreated = check(orderResponse, {
        'order created': (r) => r.status === 201,
    });

    if (!orderCreated) {
        console.log(
            `ORDER FAILED | ${table.name} | ${orderResponse.status} | ${orderResponse.body}`
        );
        return;
    }

    const orderId = orderResponse.json('id');

    console.log(
        `ORDER CREATED | ${table.name} | Order ID ${orderId}`
    );

    // =====================================================
    // 2. KITCHEN → CONFIRMED
    // =====================================================

    const confirmed = http.patch(
        `${BASE_URL}/api/kitchen/orders/${orderId}/status?status=CONFIRMED`,
        null,
        {
            headers: {
                Authorization: `Bearer ${KITCHEN_TOKEN}`,
            },
        }
    );

    check(confirmed, {
        'kitchen confirmed': (r) => r.status === 200,
    });

    // =====================================================
    // 3. KITCHEN → PREPARING
    // =====================================================

    const preparing = http.patch(
        `${BASE_URL}/api/kitchen/orders/${orderId}/status?status=PREPARING`,
        null,
        {
            headers: {
                Authorization: `Bearer ${KITCHEN_TOKEN}`,
            },
        }
    );

    check(preparing, {
        'kitchen preparing': (r) => r.status === 200,
    });

    // =====================================================
    // 4. KITCHEN → READY
    // =====================================================

    const ready = http.patch(
        `${BASE_URL}/api/kitchen/orders/${orderId}/status?status=READY`,
        null,
        {
            headers: {
                Authorization: `Bearer ${KITCHEN_TOKEN}`,
            },
        }
    );

    const readySuccess = check(ready, {
        'kitchen ready': (r) => r.status === 200,
    });

    if (!readySuccess) {
        console.log(
            `READY FAILED | Order ${orderId} | ${ready.status} | ${ready.body}`
        );
        return;
    }

    // =====================================================
    // 5. WAITER → SERVED
    // =====================================================

    const served = http.patch(
        `${BASE_URL}/api/waiter/orders/${orderId}/status?status=SERVED`,
        null,
        {
            headers: {
                Authorization: `Bearer ${WAITER_TOKEN}`,
            },
        }
    );

    const servedSuccess = check(served, {
        'waiter served': (r) => r.status === 200,
    });

    if (!servedSuccess) {
        console.log(
            `SERVED FAILED | Order ${orderId} | ${served.status} | ${served.body}`
        );
        return;
    }

    // =====================================================
    // 6. GENERATE BILL
    // =====================================================

    const billResponse = http.post(
        `${BASE_URL}/api/cashier/bills/order/${orderId}`,
        null,
        {
            headers: {
                Authorization: `Bearer ${CASHIER_TOKEN}`,
            },
        }
    );

    const billCreated = check(billResponse, {
        'bill generated': (r) => r.status === 200,
    });

    if (!billCreated) {
        console.log(
            `BILL FAILED | Order ${orderId} | ${billResponse.status} | ${billResponse.body}`
        );
        return;
    }

    const billId = billResponse.json('id');

    console.log(
        `BILL CREATED | Order ${orderId} | Bill ID ${billId}`
    );

    // =====================================================
    // 7. GET BILL
    // =====================================================

    const getBill = http.get(
        `${BASE_URL}/api/cashier/bills/${billId}`,
        {
            headers: {
                Authorization: `Bearer ${CASHIER_TOKEN}`,
            },
        }
    );

    check(getBill, {
        'bill retrieved': (r) => r.status === 200,
    });

    // =====================================================
    // 8. PRINT BILL
    // =====================================================

    const printBill = http.get(
        `${BASE_URL}/api/cashier/bills/${billId}/print`,
        {
            headers: {
                Authorization: `Bearer ${CASHIER_TOKEN}`,
            },
        }
    );

    check(printBill, {
        'bill printed': (r) => r.status === 200,
    });

    // =====================================================
    // 9. MARK PRINTED
    // =====================================================

    const markedPrinted = http.patch(
        `${BASE_URL}/api/cashier/bills/${billId}/printed`,
        null,
        {
            headers: {
                Authorization: `Bearer ${CASHIER_TOKEN}`,
            },
        }
    );

    check(markedPrinted, {
        'bill marked printed': (r) => r.status === 200,
    });

    // =====================================================
    // 10. MARK PAID
    // =====================================================

    const paid = http.patch(
        `${BASE_URL}/api/cashier/bills/${billId}/paid`,
        null,
        {
            headers: {
                Authorization: `Bearer ${CASHIER_TOKEN}`,
            },
        }
    );

    const paidSuccess = check(paid, {
        'bill paid': (r) => r.status === 200,
    });

    if (!paidSuccess) {
        console.log(
            `PAYMENT FAILED | Bill ${billId} | ${paid.status} | ${paid.body}`
        );
        return;
    }

    // =====================================================
    // 11. VERIFY FINAL BILL STATUS
    // =====================================================

    const finalBill = http.get(
        `${BASE_URL}/api/cashier/bills/${billId}`,
        {
            headers: {
                Authorization: `Bearer ${CASHIER_TOKEN}`,
            },
        }
    );

    check(finalBill, {
        'final bill is PAID': (r) =>
            r.status === 200 &&
            r.json('status') === 'PAID',
    });

    console.log(
        `SUCCESS | ${table.name} | Order ${orderId} | Bill ${billId}`
    );

    sleep(1);
}