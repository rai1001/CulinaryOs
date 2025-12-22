import { db } from '../firebase/config';
import { collection, addDoc, getDocs, query, where, Timestamp, orderBy } from 'firebase/firestore';
import { OccupancyData } from '../types/occupancy';
import * as XLSX from 'xlsx';

const COLLECTION_NAME = 'occupancy';

export function parseOccupancyImport(rawData: any[]): OccupancyData[] {
    return rawData.map((row: any) => {
        // Handle various date formats if necessary, for now assume standard Date object or string
        const dateStr = row['Date'] || row['date'];
        const date = new Date(dateStr);

        const totalRooms = Number(row['Total Rooms'] || row['totalRooms'] || 0);
        const occupiedRooms = Number(row['Occupied Rooms'] || row['occupiedRooms'] || 0);
        const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

        // Simple heuristic for PAX if not provided: 2 pax per room * 0.8 occupancy factor usually, 
        // but let's assume raw data might have PAX or we estimate 2 pax/room as base
        const estimatedPax = Number(row['Pax'] || row['pax'] || (occupiedRooms * 2));

        return {
            date,
            totalRooms,
            occupiedRooms,
            occupancyRate,
            estimatedPax,
            mealType: (row['Meal Type'] || 'breakfast').toLowerCase() as 'breakfast' | 'lunch' | 'dinner',
            specialEvents: row['Events'] ? String(row['Events']).split(',').map((s: string) => s.trim()) : []
        };
    }).filter((d: OccupancyData) => !isNaN(d.date.getTime()));
}

export async function saveOccupancyData(data: OccupancyData[]): Promise<void> {
    const batchSave = data.map(async (item) => {
        await addDoc(collection(db, COLLECTION_NAME), {
            ...item,
            date: Timestamp.fromDate(item.date)
        });
    });

    await Promise.all(batchSave);
}

export async function importOccupancyData(file: File): Promise<OccupancyData[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                const rawData = XLSX.utils.sheet_to_json(worksheet);
                const parsedData = parseOccupancyImport(rawData);

                await saveOccupancyData(parsedData);
                resolve(parsedData);

            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = (error) => reject(error);
        reader.readAsBinaryString(file);
    });
}

export async function getOccupancyForecast(
    startDate: Date,
    endDate: Date
): Promise<OccupancyData[]> {
    const q = query(
        collection(db, COLLECTION_NAME),
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate)),
        orderBy('date', 'asc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            ...data,
            date: data.date.toDate()
        } as OccupancyData;
    });
}
