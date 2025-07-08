// // import React from 'react';

// // export interface BatteryCellProps {
// //   id: number;
// //   voltage: number;
// //   temperature: number;
// //   status: 'normal' | 'warning' | 'critical';
// // }

// // const BatteryCell: React.FC<BatteryCellProps> = ({ id, voltage, temperature, status }) => {
// //   const getColor = () => {
// //     if (status === 'critical') return 'bg-red-500';
// //     if (status === 'warning') return 'bg-yellow-400';
// //     return 'bg-green-500';
// //   };

// //   return (
// //     <div
// //       className={`w-full h-[40px] ${getColor()} border border-white text-xs flex items-center justify-between px-2 rounded my-1`}
// //       title={`Cell ${id}\nVoltage: ${voltage}V\nTemp: ${temperature}°C`}
// //     >
// //       <span>#{id}</span>
// //       <span>{voltage.toFixed(2)}V</span>
// //       <span>{temperature.toFixed(1)}°C</span>
// //     </div>
// //   );
// // };

// // export default BatteryCell;


// import React, { useState, useEffect } from 'react';
// import { SerialPort } from 'serialport';

// export interface BatteryCellProps {
//   id: number;
//   voltage: number;
//   temperature: number;
//   status: 'normal' | 'warning' | 'critical';
// }

// const BatteryCell: React.FC<BatteryCellProps> = ({ id, voltage, temperature, status }) => {
//   const getColor = () => {
//     if (status === 'critical') return 'bg-red-500';
//     if (status === 'warning') return 'bg-yellow-400';
//     return 'bg-green-500';
//   };

//   return (
//     <div
//       className={`w-full h-[40px] ${getColor()} border border-white text-xs flex items-center justify-between px-2 rounded my-1`}
//       title={`Cell ${id}\nVoltage: ${voltage}V\nTemp: ${temperature}°C`}
//     >
//       <span>#{id}</span>
//       <span>{voltage.toFixed(2)}V</span>
//       <span>{temperature.toFixed(1)}°C</span>
//     </div>
//   );
// };

// const BatteryMonitor: React.FC = () => {
//   const [cells, setCells] = useState<BatteryCellProps[]>([
//     { id: 1, voltage: 0, temperature: 0, status: 'normal' },
//     { id: 2, voltage: 0, temperature: 0, status: 'normal' },
//     // Add more cells as needed
//   ]);
//   const [port, setPort] = useState<SerialPort | null>(null);

//   // Connect to serial port
//   const connectToPort = async () => {
//     try {
//       const newPort = new SerialPort({
//         path: 'COM4', // Replace with your application port (e.g., COM4)
//         baudRate: 9600, // Match this with PuTTY and bridge settings
//       });
//       setPort(newPort);
//       readSerialData(newPort);
//     } catch (error) {
//       console.error('Error connecting to serial port:', error);
//     }
//   };

//   // Read data from serial port
//   const readSerialData = (port: SerialPort) => {
//     port.on('data', (data) => {
//       try {
//         // Parse the incoming data (adjust based on your format)
//         const dataStr = data.toString().trim();
//         // Example 1: JSON format - {"id":1,"voltage":3.7,"temperature":25.5}
//         let parsedData;
//         try {
//           parsedData = JSON.parse(dataStr);
//         } catch (jsonError) {
//           // Example 2: CSV format - "1,3.7,25.5"
//           const [id, voltage, temperature] = dataStr.split(',').map(Number);
//           parsedData = { id, voltage, temperature };
//         }

//         if (parsedData.id && parsedData.voltage !== undefined && parsedData.temperature !== undefined) {
//           setCells((prevCells) =>
//             prevCells.map((cell) =>
//               cell.id === parsedData.id
//                 ? {
//                     ...cell,
//                     voltage: parsedData.voltage,
//                     temperature: parsedData.temperature,
//                     status: parsedData.voltage < 3.3 ? 'critical' : parsedData.voltage < 3.5 ? 'warning' : 'normal',
//                   }
//                 : cell
//             )
//           );
//         }
//       } catch (error) {
//         console.error('Error parsing serial data:', error);
//       }
//     });

//     port.on('error', (error) => {
//       console.error('Serial port error:', error);
//     });
//   };

//   // Disconnect from port
//   const disconnectFromPort = () => {
//     if (port) {
//       port.close((error) => {
//         if (error) console.error('Error closing port:', error);
//         setPort(null);
//       });
//     }
//   };

//   useEffect(() => {
//     return () => {
//       if (port) disconnectFromPort();
//     };
//   }, [port]);

//   return (
//     <div className="p-4">
//       <button
//         onClick={connectToPort}
//         className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//         disabled={port !== null}
//       >
//         Connect to Serial Port
//       </button>
//       {port && (
//         <button
//           onClick={disconnectFromPort}
//           className="ml-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
//         >
//           Disconnect
//         </button>
//       )}
//       <div>
//         {cells.map((cell) => (
//           <BatteryCell key={cell.id} {...cell} />
//         ))}
//       </div>
//     </div>
//   );
// };

// export default BatteryCell;