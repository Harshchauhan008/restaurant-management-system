import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '10s', target: 50 },
        { duration: '20s', target: 100 },
        { duration: '30s', target: 150 },
        { duration: '30s', target: 200 },
        { duration: '30s', target: 250 },
        { duration: '10s', target: 0 },
    ],
};

const BASE_URL = 'http://localhost:8080';

const KITCHEN_TOKEN = __ENV.KITCHEN_TOKEN;
const WAITER_TOKEN = __ENV.WAITER_TOKEN;

const TABLES = [
    { name: 'T01', qrToken: 'e2adf520-e681-4c94-a7de-370c7827a8d6', sessionCode: '9760' },
    { name: 'T02', qrToken: '273fd540-a88e-41ab-aef5-239662231112', sessionCode: '1201' },
    { name: 'T03', qrToken: 'b9408165-5b3c-4103-99f0-6805e670b6d4', sessionCode: '1204' },
    { name: 'T04', qrToken: '965e9649-9269-4d88-ba60-1df14845ce20', sessionCode: '1205' },
    { name: 'T05', qrToken: '25a02c14-2dc7-4872-83fa-65efac2c166a', sessionCode: '1203' },
    { name: 'T06', qrToken: 'efba6696-b0ff-4b16-a30d-b8680bebc052', sessionCode: '1206' },
];
export default function () {

    const table = TABLES[(__VU - 1) % TABLES.length];

    // ========================================
    // 1. CREATE ORDER
    // ========================================

    const orderPayload = JSON.stringify({
        qrToken: table.qrToken,
        sessionCode: table.sessionCode,
        items: [
            {
                menuItemId: 2,
                quantity: 5,
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

    const orderSuccess = check(orderResponse, {
        'order created': (r) => r.status === 201,
    });

    if (!orderSuccess) {
        console.log(
            `ORDER FAILED | VU ${__VU} | ${orderResponse.status} | ${orderResponse.body}`
        );
        return;
    }

    const orderId = orderResponse.json('id');

    // ========================================
    // 2. KITCHEN → CONFIRMED
    // ========================================

    const confirmed = http.patch(
        `${BASE_URL}/api/kitchen/orders/${orderId}/status?status=CONFIRMED`,
        null,
        {
            headers: {
                Authorization: `Bearer ${KITCHEN_TOKEN}`,
            },
        }
    );

    const confirmedSuccess = check(confirmed, {
        'kitchen confirmed': (r) => r.status === 200,
    });

    if (!confirmedSuccess) {
        console.log(
            `CONFIRMED FAILED | Order ${orderId} | ${confirmed.status} | ${confirmed.body}`
        );
        return;
    }

    // ========================================
    // 3. KITCHEN → PREPARING
    // ========================================

    const preparing = http.patch(
        `${BASE_URL}/api/kitchen/orders/${orderId}/status?status=PREPARING`,
        null,
        {
            headers: {
                Authorization: `Bearer ${KITCHEN_TOKEN}`,
            },
        }
    );

    const preparingSuccess = check(preparing, {
        'kitchen preparing': (r) => r.status === 200,
    });

    if (!preparingSuccess) {
        console.log(
            `PREPARING FAILED | Order ${orderId} | ${preparing.status} | ${preparing.body}`
        );
        return;
    }

    // ========================================
    // 4. KITCHEN → READY
    // ========================================

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

    // ========================================
    // 5. WAITER → SERVED
    // ========================================

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

    sleep(1);
}