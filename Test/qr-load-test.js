import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '10s', target: 100 },
        { duration: '30s', target: 150 },
        { duration: '1m', target: 200 },
        { duration: '1m', target: 250 },
        { duration: '10s', target: 0 },
    ],
};

const BASE_URL = 'http://localhost:8080';

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

    // Distribute VUs across the 6 tables
    const table = TABLES[(__VU - 1) % TABLES.length];

    // =========================================
    // 1. VERIFY QR CODE
    // =========================================

    const qrResponse = http.get(
        `${BASE_URL}/api/table/verify/${table.qrToken}`
    );

    const qrSuccess = check(qrResponse, {
        'QR status is 200': (r) => r.status === 200,

        'QR is valid': (r) =>
            r.status === 200 &&
            r.json('valid') === true,

        'QR table matches': (r) =>
            r.status === 200 &&
            r.json('tableNumber') === table.name,
    });

    if (!qrSuccess) {
        console.log(
            `QR FAILED | VU: ${__VU} | Table: ${table.name} | Status: ${qrResponse.status} | Body: ${qrResponse.body}`
        );

        sleep(1);
        return;
    }

    // =========================================
    // 2. LOAD MENU CATEGORIES
    // =========================================

    const categoryResponse = http.get(
        `${BASE_URL}/api/menu/categories`
    );

    check(categoryResponse, {
        'categories status is 200': (r) =>
            r.status === 200,

        'categories returned': (r) =>
            r.status === 200 &&
            Array.isArray(r.json()),
    });

    // =========================================
    // 3. LOAD MENU ITEMS
    // =========================================

    const menuResponse = http.get(
        `${BASE_URL}/api/menu/items`
    );

    const menuSuccess = check(menuResponse, {
        'menu status is 200': (r) =>
            r.status === 200,

        'menu returned': (r) =>
            r.status === 200 &&
            Array.isArray(r.json()),
    });

    if (!menuSuccess) {
        console.log(
            `MENU FAILED | VU: ${__VU} | Table: ${table.name} | Status: ${menuResponse.status} | Body: ${menuResponse.body}`
        );

        sleep(1);
        return;
    }

    // =========================================
    // 4. CREATE ORDER
    // =========================================

    const payload = JSON.stringify({
        qrToken: table.qrToken,
        sessionCode: table.sessionCode,
      items: [
        {
            menuItemId: 2,
            quantity: 5
        }
    ]
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const orderResponse = http.post(
        `${BASE_URL}/api/orders`,
        payload,
        params
    );

    if (orderResponse.status !== 201) {
        console.log(
            `ORDER FAILED | VU: ${__VU} | Table: ${table.name} | Status: ${orderResponse.status} | Body: ${orderResponse.body}`
        );
    }

    check(orderResponse, {
        'order status is 201': (r) =>
            r.status === 201,

        'order created': (r) =>
            r.status === 201 &&
            r.json('orderNumber') !== undefined,
    });

    sleep(1);
}