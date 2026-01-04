const fs = require('fs');
const https = require('https');
const path = require('path');

const imageMap = {
    // PHONES
    '101': 'https://fdn2.gsmarena.com/vv/bigpic/vivo-t3.jpg',
    '103': 'https://fdn2.gsmarena.com/vv/bigpic/vivo-iqoo-z9.jpg',
    '104': 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-m15.jpg',
    '105': 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-note-13-5g.jpg',
    '202': 'https://fdn2.gsmarena.com/vv/bigpic/vivo-v30-pro.jpg',
    '203': 'https://fdn2.gsmarena.com/vv/bigpic/oneplus-12r.jpg',
    '206': 'https://fdn2.gsmarena.com/vv/bigpic/vivo-iqoo-neo9-pro.jpg',
    '205': 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a35.jpg',

    // LAPTOPS
    '304': 'https://m.media-amazon.com/images/I/71Y9L3y-dbL._SL1500_.jpg',
    '305': 'https://m.media-amazon.com/images/I/61s7sJEpsVL._SL1500_.jpg',
    '310': 'https://m.media-amazon.com/images/I/71GYpWAxmGL._SL1500_.jpg',
    '313': 'https://m.media-amazon.com/images/I/71vFKBpKakL._SL1500_.jpg',
    '301': 'https://m.media-amazon.com/images/I/71R2o5+iCLL._SL1500_.jpg',
    '303': 'https://m.media-amazon.com/images/I/71C9+P9+kRL._SL1500_.jpg',
    '315': 'https://m.media-amazon.com/images/I/71M3f2j1EBL._SL1500_.jpg',

    // NEWS
    'n1': 'https://m.media-amazon.com/images/I/71I2335JorL._SL1500_.jpg',
    'n2': 'https://m.media-amazon.com/images/I/71GYpWAxmGL._SL1500_.jpg',
    'n3': 'https://m.media-amazon.com/images/I/71vFKBpKakL._SL1500_.jpg'
};

const download = (url, dest) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        const options = {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        };
        https.get(url, options, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(`Failed with status ${res.statusCode}`));
                return;
            }
            res.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => reject(err));
        });
    });
};

const run = async () => {
    const dir = path.join(__dirname, 'assets', 'products');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    for (const [id, url] of Object.entries(imageMap)) {
        const dest = path.join(dir, `${id}.jpg`);
        console.log(`Downloading actual image for ${id}...`);
        try {
            await download(url, dest);
            console.log(`Success: ${id}`);
        } catch (e) {
            console.error(`Failed: ${id} - ${e.message}`);
        }
    }
};

run();
