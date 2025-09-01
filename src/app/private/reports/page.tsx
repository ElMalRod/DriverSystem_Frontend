"use client";

import { useState, useEffect } from "react";
import {
  FaFilePdf,
  FaFileExcel,
  FaFileImage,
  FaSearch,
  FaChartBar,
  FaTools,
  FaCar,
  FaUser,
  FaClipboardList
} from "react-icons/fa";
import { getSessionUser } from "@/utils/session";
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';

// Importación condicional de pdfMake para evitar errores de runtime
let pdfMake: any = null;
let pdfFonts: any = null;

try {
  pdfMake = require('pdfmake/build/pdfmake');
  pdfFonts = require('pdfmake/build/vfs_fonts');

  if (pdfMake && pdfFonts && pdfFonts.pdfMake) {
    pdfMake.vfs = pdfFonts.pdfMake.vfs;
  }
} catch (error) {
  console.warn('pdfMake no está disponible:', error);
}

declare global {
  interface Window {
    Swal: any;
  }
}

// Interfaces para los reportes
interface WorkOrderReport {
  id: number;
  code: string;
  description?: string;
  estimatedHours?: number;
  openedAt: string;
  closedAt?: string;
  maintenanceType: string;
  status: string;
  customerId?: number;
  docNumberCustomer?: string;
  customer?: string;
  phoneCustomer?: string;
  createdBy?: string;
  vin?: string;
  plate: string;
  model: string;
  modelYear?: number;
  color?: string;
  make: string;
  employee?: string;
  totalCost?: number;
}

interface VehicleHistoryReport {
  id: number;
  status: string;
  code: string;
  plate: string;
  logType: string;
  maintenanceType: string;
  model: string;
  make: string;
  color: string;
  modelYear: number;
  note: string;
  employee: string;
}

interface SparePartsReport {
  productId: number;
  productName: string;
  quantity: number;
  totalUsed: number;
  unit: string;
  category: string;
}

interface WorkByMechanicReport {
  employeeId: number;
  employeeName: string;
  workOrdersCount: number;
  totalHours: number;
  maintenanceType: string;
  period: string;
}

type ReportType = 'work-orders' | 'vehicle-history' | 'spare-parts' | 'mechanic-work' | 'vehicle-parts';

export default function ReportsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportType>('work-orders');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [reportData, setReportData] = useState<(WorkOrderReport | VehicleHistoryReport | SparePartsReport | WorkByMechanicReport)[]>([]);
  const [mechanicUsers, setMechanicUsers] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    vehiclePlate: '',
    mechanicId: '',
    maintenanceType: '',
    model: ''
  });

  useEffect(() => {
    const user = getSessionUser();
    setCurrentUser(user);

    // Set default date range to current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    setDateRange({
      startDate: startOfMonth.toISOString().split('T')[0],
      endDate: endOfMonth.toISOString().split('T')[0]
    });
  }, []);

  // Load mechanic users when mechanic-work report is selected
  useEffect(() => {
    if (selectedReport === 'mechanic-work') {
      loadMechanicUsers();
    }
  }, [selectedReport]);

  const loadMechanicUsers = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/`);
      if (!response.ok) throw new Error('Failed to fetch users');

      const users = await response.json();

      // Filtrar solo empleados y especialistas
      const mechanics = users.filter((user: any) =>
        user.roleName === 'Empleado interno' || user.roleName === 'Especialista externo'
      );

      setMechanicUsers(mechanics);
    } catch (error) {
      console.error('Error loading mechanic users:', error);
      setMechanicUsers([]);
    }
  };

  const reportOptions = [
    {
      id: 'work-orders' as ReportType,
      title: 'Trabajos por Período',
      description: 'Reportes de órdenes de trabajo realizadas en un período',
      icon: FaClipboardList,
      color: 'bg-blue-500'
    },
    {
      id: 'vehicle-history' as ReportType,
      title: 'Historial por Vehículo',
      description: 'Historial completo de mantenimiento de un vehículo específico',
      icon: FaCar,
      color: 'bg-green-500'
    },
    {
      id: 'mechanic-work' as ReportType,
      title: 'Trabajos por Mecánico',
      description: 'Trabajos realizados por empleados y especialistas filtrados',
      icon: FaUser,
      color: 'bg-purple-500'
    },
    {
      id: 'spare-parts' as ReportType,
      title: 'Uso de Repuestos',
      description: 'Uso de repuestos por período de tiempo',
      icon: FaTools,
      color: 'bg-orange-500'
    },
    {
      id: 'vehicle-parts' as ReportType,
      title: 'Repuestos por Modelo',
      description: 'Repuestos más usados por modelo de vehículo',
      icon: FaChartBar,
      color: 'bg-red-500'
    }
  ];

  const generateReport = async () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      if (window.Swal) {
        window.Swal.fire({
          icon: 'warning',
          title: 'Fechas requeridas',
          text: 'Por favor selecciona un rango de fechas'
        });
      }
      return;
    }

    setLoading(true);
    try {
      let data: any[] = [];

      switch (selectedReport) {
        case 'work-orders':
          data = await generateWorkOrdersReport();
          break;
        case 'vehicle-history':
          data = await generateVehicleHistoryReport();
          break;
        case 'mechanic-work':
          data = await generateMechanicWorkReport();
          break;
        case 'spare-parts':
          data = await generateSparePartsReport();
          break;
        case 'vehicle-parts':
          data = await generateVehiclePartsReport();
          break;
      }

      setReportData(data);
    } catch (error) {
      console.error('Error generating report:', error);
      if (window.Swal) {
        window.Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo generar el reporte'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const generateWorkOrdersReport = async (): Promise<WorkOrderReport[]> => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reporte/work/order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dateStart: dateRange.startDate,
        dateEnd: dateRange.endDate
      }),
    });

    if (!response.ok) throw new Error('Failed to fetch work orders report');
    return await response.json();
  };

  const generateVehicleHistoryReport = async (): Promise<VehicleHistoryReport[]> => {
    if (!filters.vehiclePlate) {
      throw new Error('Se requiere la placa del vehículo');
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reporte/vehicle/${filters.vehiclePlate}`);
    if (!response.ok) throw new Error('Failed to fetch vehicle history');
    return await response.json();
  };

  const generateMechanicWorkReport = async (): Promise<WorkByMechanicReport[]> => {
    if (!filters.mechanicId) {
      throw new Error('Se requiere seleccionar un empleado');
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reporte/work/order/date-type-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dateStart: dateRange.startDate,
        dateEnd: dateRange.endDate,
        userId: parseInt(filters.mechanicId),
        typeMantenimiento: filters.maintenanceType ? parseInt(filters.maintenanceType) : null
      }),
    });

    if (!response.ok) throw new Error('Failed to fetch mechanic work report');
    return await response.json();
  };

  const generateSparePartsReport = async (): Promise<SparePartsReport[]> => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reporte/spare/parts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dateStart: dateRange.startDate,
        dateEnd: dateRange.endDate
      }),
    });

    if (!response.ok) throw new Error('Failed to fetch spare parts report');
    return await response.json();
  };

  const generateVehiclePartsReport = async (): Promise<SparePartsReport[]> => {
    if (!filters.model) {
      throw new Error('Se requiere el modelo del vehículo');
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reporte/vehicle/parts/${filters.model}`);
    if (!response.ok) throw new Error('Failed to fetch vehicle parts report');
    return await response.json();
  };

  const exportToPDF = () => {
    if (reportData.length === 0) {
      if (window.Swal) {
        window.Swal.fire({
          icon: 'warning',
          title: 'Sin datos',
          text: 'No hay datos para exportar'
        });
      }
      return;
    }

    // Verificar si pdfMake está disponible
    if (!pdfMake) {
      if (window.Swal) {
        window.Swal.fire({
          icon: 'warning',
          title: 'PDF no disponible',
          text: 'La librería PDF no está cargada. Intente recargar la página.',
          confirmButtonText: 'Recargar',
          showCancelButton: true,
          cancelButtonText: 'Cancelar'
        }).then((result: any) => {
          if (result.isConfirmed) {
            window.location.reload();
          }
        });
      }
      return;
    }

    try {
      const headers = getTableHeaders(selectedReport);
      const rows = reportData.map(item => getTableRow(selectedReport, item));

      // Crear tabla para pdfMake
      const tableBody = [
        headers.map(header => ({ text: header, style: 'tableHeader' })),
        ...rows.map(row => row.map(cell => ({ text: cell, style: 'tableCell' })))
      ];

      const docDefinition = {
        pageOrientation: 'landscape',
        content: [
          {
            text: `Reporte - ${reportOptions.find(opt => opt.id === selectedReport)?.title}`,
            style: 'header',
            margin: [0, 0, 0, 20]
          },
          {
            text: `Fecha: ${dateRange.startDate} - ${dateRange.endDate}`,
            style: 'subheader',
            margin: [0, 0, 0, 20]
          },
          {
            table: {
              headerRows: 1,
              widths: headers.map(() => 'auto'),
              body: tableBody
            },
            layout: {
              fillColor: function (rowIndex: number) {
                return (rowIndex % 2 === 0) ? '#f5f5f5' : null;
              }
            }
          }
        ],
        styles: {
          header: {
            fontSize: 18,
            bold: true,
            color: '#333'
          },
          subheader: {
            fontSize: 12,
            color: '#666'
          },
          tableHeader: {
            bold: true,
            fontSize: 10,
            color: '#fff',
            fillColor: '#428bca'
          },
          tableCell: {
            fontSize: 8
          }
        }
      };

      pdfMake.createPdf(docDefinition).download(`reporte-${selectedReport}-${new Date().toISOString().split('T')[0]}.pdf`);

      if (window.Swal) {
        window.Swal.fire({
          icon: 'success',
          title: 'PDF Generado',
          text: 'El archivo PDF se ha descargado correctamente'
        });
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      if (window.Swal) {
        window.Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo generar el PDF. Error: ' + (error as Error).message
        });
      }
    }
  };

  const exportToExcel = () => {
    if (reportData.length === 0) {
      if (window.Swal) {
        window.Swal.fire({
          icon: 'warning',
          title: 'Sin datos',
          text: 'No hay datos para exportar'
        });
      }
      return;
    }

    try {
      const headers = getTableHeaders(selectedReport);
      const rows = reportData.map(item => getTableRow(selectedReport, item));

      // Crear datos para Excel
      const excelData = [
        [`Reporte - ${reportOptions.find(opt => opt.id === selectedReport)?.title}`],
        [`Fecha: ${dateRange.startDate} - ${dateRange.endDate}`],
        [], // Línea vacía
        headers,
        ...rows
      ];

      // Crear workbook y worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(excelData);

      // Estilos básicos
      ws['!cols'] = headers.map(() => ({ width: 15 }));

      // Agregar worksheet al workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Reporte');

      // Descargar archivo
      XLSX.writeFile(wb, `reporte-${selectedReport}-${new Date().toISOString().split('T')[0]}.xlsx`);

      if (window.Swal) {
        window.Swal.fire({
          icon: 'success',
          title: 'Excel Generado',
          text: 'El archivo Excel se ha descargado correctamente'
        });
      }
    } catch (error) {
      console.error('Error generating Excel:', error);
      if (window.Swal) {
        window.Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo generar el Excel'
        });
      }
    }
  };

  const exportToImage = () => {
    if (reportData.length === 0) {
      if (window.Swal) {
        window.Swal.fire({
          icon: 'warning',
          title: 'Sin datos',
          text: 'No hay datos para exportar'
        });
      }
      return;
    }

    try {
      // Buscar la tabla en el DOM
      const tableElement = document.querySelector('table');
      if (!tableElement) {
        throw new Error('No se encontró la tabla para capturar');
      }

      // Mostrar indicador de carga
      if (window.Swal) {
        window.Swal.fire({
          title: 'Generando imagen...',
          text: 'Por favor espere',
          allowOutsideClick: false,
          showConfirmButton: false,
          willOpen: () => {
            window.Swal.showLoading();
          }
        });
      }

      // Crear un contenedor temporal con estilos simplificados
      const tempContainer = document.createElement('div');
      tempContainer.style.backgroundColor = '#ffffff';
      tempContainer.style.padding = '20px';
      tempContainer.style.fontFamily = 'Arial, sans-serif';

      // Clonar la tabla y simplificar estilos
      const clonedTable = tableElement.cloneNode(true) as HTMLElement;

      // Remover clases de Tailwind que pueden causar problemas
      clonedTable.className = '';
      clonedTable.style.width = '100%';
      clonedTable.style.borderCollapse = 'collapse';
      clonedTable.style.fontSize = '12px';

      // Simplificar estilos de celdas
      const cells = clonedTable.querySelectorAll('th, td');
      cells.forEach(cell => {
        const element = cell as HTMLElement;
        element.className = '';
        element.style.border = '1px solid #ddd';
        element.style.padding = '8px';
        element.style.textAlign = 'left';
        element.style.backgroundColor = element.tagName === 'TH' ? '#f5f5f5' : '#ffffff';
        element.style.color = '#000000';
        element.style.fontWeight = element.tagName === 'TH' ? 'bold' : 'normal';
      });

      tempContainer.appendChild(clonedTable);

      // Agregar temporalmente al DOM (fuera de la vista)
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '-9999px';
      document.body.appendChild(tempContainer);

      html2canvas(tempContainer, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: false,
        width: tempContainer.offsetWidth,
        height: tempContainer.offsetHeight,
        // Ignorar elementos problemáticos
        ignoreElements: (element) => {
          // Ignorar elementos con estilos complejos
          const style = window.getComputedStyle(element);
          return style.display === 'none' ||
                 style.visibility === 'hidden' ||
                 style.opacity === '0';
        },
        // Configuración adicional para mejor compatibilidad
        onclone: (clonedDoc) => {
          // Limpiar estilos problemáticos en el clon
          const problematicElements = clonedDoc.querySelectorAll('*');
          problematicElements.forEach(el => {
            const element = el as HTMLElement;
            const computedStyle = window.getComputedStyle(element);

            // Remover funciones de color modernas que causan problemas
            if (computedStyle.backgroundColor &&
                (computedStyle.backgroundColor.includes('lab(') ||
                 computedStyle.backgroundColor.includes('lch(') ||
                 computedStyle.backgroundColor.includes('oklab('))) {
              element.style.backgroundColor = '#ffffff';
            }

            if (computedStyle.color &&
                (computedStyle.color.includes('lab(') ||
                 computedStyle.color.includes('lch(') ||
                 computedStyle.color.includes('oklab('))) {
              element.style.color = '#000000';
            }
          });
        }
      }).then((canvas) => {
        // Limpiar el contenedor temporal
        document.body.removeChild(tempContainer);

        // Cerrar el indicador de carga
        if (window.Swal) {
          window.Swal.close();
        }

        // Crear enlace de descarga
        const link = document.createElement('a');
        link.download = `reporte-${selectedReport}-${new Date().toISOString().split('T')[0]}.png`;
        link.href = canvas.toDataURL('image/png', 0.9);
        link.click();

        if (window.Swal) {
          window.Swal.fire({
            icon: 'success',
            title: 'Imagen Generada',
            text: 'La imagen se ha descargado correctamente',
            timer: 2000,
            showConfirmButton: false
          });
        }
      }).catch((error) => {
        // Limpiar el contenedor temporal en caso de error
        if (document.body.contains(tempContainer)) {
          document.body.removeChild(tempContainer);
        }

        // Cerrar el indicador de carga
        if (window.Swal) {
          window.Swal.close();
        }

        console.error('Error generating image:', error);

        // Intentar método alternativo si html2canvas falla
        if (error.message.includes('lab') || error.message.includes('color')) {
          exportToImageAlternative();
        } else {
          if (window.Swal) {
            window.Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo generar la imagen: ' + error.message
            });
          }
        }
      });
    } catch (error) {
      console.error('Error preparing image export:', error);
      if (window.Swal) {
        window.Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al preparar la exportación de imagen'
        });
      }
    }
  };

  // Método alternativo para exportar imagen usando canvas nativo
  const exportToImageAlternative = () => {
    try {
      const tableElement = document.querySelector('table');
      if (!tableElement) {
        throw new Error('No se encontró la tabla');
      }

      // Crear canvas nativo
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('No se pudo crear el contexto del canvas');
      }

      // Configurar canvas
      canvas.width = tableElement.offsetWidth * 2;
      canvas.height = tableElement.offsetHeight * 2;
      ctx.scale(2, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, tableElement.offsetWidth, tableElement.offsetHeight);

      // Dibujar texto simple (método básico)
      ctx.fillStyle = '#000000';
      ctx.font = '12px Arial';
      ctx.fillText('Reporte generado - Método alternativo', 10, 20);
      ctx.fillText(`Fecha: ${new Date().toLocaleDateString()}`, 10, 40);

      // Crear descarga
      const link = document.createElement('a');
      link.download = `reporte-${selectedReport}-${new Date().toISOString().split('T')[0]}-simple.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      if (window.Swal) {
        window.Swal.fire({
          icon: 'success',
          title: 'Imagen Simple Generada',
          text: 'Se generó una versión simplificada de la imagen'
        });
      }
    } catch (error) {
      console.error('Error in alternative image export:', error);
      if (window.Swal) {
        window.Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo generar la imagen alternativa'
        });
      }
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Reportes del Sistema
          </h1>
          <p className="text-gray-600">
            Genera reportes detallados del taller y operaciones
          </p>
        </div>

        {/* Report Selection */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Seleccionar Reporte</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportOptions.map((option) => {
              const Icon = option.icon;
              return (
                <div
                  key={option.id}
                  onClick={() => setSelectedReport(option.id)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedReport === option.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center mb-2">
                    <div className={`w-10 h-10 rounded-lg ${option.color} flex items-center justify-center mr-3`}>
                      <Icon className="text-white" size={20} />
                    </div>
                    <h3 className="font-semibold text-gray-800">{option.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600">{option.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Inicio
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Fin
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Conditional Filters */}
            {selectedReport === 'vehicle-history' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Placa del Vehículo
                </label>
                <input
                  type="text"
                  placeholder="Ej: ABC-123"
                  value={filters.vehiclePlate}
                  onChange={(e) => setFilters(prev => ({ ...prev, vehiclePlate: e.target.value.toUpperCase() }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {selectedReport === 'mechanic-work' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Empleado
                  </label>
                  <select
                    value={filters.mechanicId}
                    onChange={(e) => setFilters(prev => ({ ...prev, mechanicId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar empleado...</option>
                    {mechanicUsers.map((mechanic) => (
                      <option key={mechanic.id} value={mechanic.id}>
                        {mechanic.name || mechanic.userName} - {mechanic.roleName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo Mantenimiento
                  </label>
                  <select
                    value={filters.maintenanceType}
                    onChange={(e) => setFilters(prev => ({ ...prev, maintenanceType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todos</option>
                    <option value="1">Correctivo</option>
                    <option value="2">Preventivo</option>
                  </select>
                </div>
              </>
            )}

            {selectedReport === 'vehicle-parts' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Modelo del Vehículo
                </label>
                <input
                  type="text"
                  placeholder="Ej: Corolla"
                  value={filters.model}
                  onChange={(e) => setFilters(prev => ({ ...prev, model: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          {/* Generate Report Button */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={generateReport}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Generando...
                </>
              ) : (
                <>
                  <FaSearch size={16} />
                  Generar Reporte
                </>
              )}
            </button>
          </div>
        </div>

        {/* Report Results */}
        {reportData.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                Resultados del Reporte
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={exportToPDF}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                >
                  <FaFilePdf size={14} />
                  PDF
                </button>
                <button
                  onClick={exportToExcel}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                >
                  <FaFileExcel size={14} />
                  Excel
                </button>
                <button
                  onClick={exportToImage}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                >
                  <FaFileImage size={14} />
                  Imagen
                </button>
              </div>
            </div>

            {/* Dynamic Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {getTableHeaders(selectedReport).map((header, index) => (
                      <th
                        key={index}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      {getTableRow(selectedReport, item).map((cell, cellIndex) => (
                        <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {reportData.length === 0 && (
              <div className="text-center py-8">
                <FaChartBar className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600">No se encontraron datos para el período seleccionado</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper functions for dynamic table
function getTableHeaders(reportType: ReportType): string[] {
  switch (reportType) {
    case 'work-orders':
      return ['Código', 'Descripción', 'Cliente', 'Teléfono', 'Vehículo', 'Placa', 'VIN', 'Estado', 'Tipo', 'Horas Est.', 'Fecha Creación', 'Fecha Cierre', 'Creado Por'];
    case 'vehicle-history':
      return ['Código', 'Tipo Log', 'Tipo Mantenimiento', 'Nota', 'Empleado', 'Fecha'];
    case 'mechanic-work':
      return ['Mecánico', 'Órdenes', 'Horas Totales', 'Tipo Mantenimiento', 'Período'];
    case 'spare-parts':
      return ['Producto', 'Categoría', 'Cantidad Usada', 'Unidad', 'Total'];
    case 'vehicle-parts':
      return ['Producto', 'Modelo', 'Cantidad Usada', 'Unidad', 'Frecuencia'];
    default:
      return [];
  }
}

function getTableRow(reportType: ReportType, item: any): string[] {
  switch (reportType) {
    case 'work-orders':
      return [
        item.code || '',
        item.description || '',
        item.customer || '',
        item.phoneCustomer || '',
        `${item.make || ''} ${item.model || ''} ${item.modelYear || ''} ${item.color || ''}`,
        item.plate || '',
        item.vin || '',
        item.status || '',
        item.maintenanceType || '',
        item.estimatedHours?.toString() || '',
        item.openedAt ? new Date(item.openedAt).toLocaleDateString('es-ES') : '',
        item.closedAt ? new Date(item.closedAt).toLocaleDateString('es-ES') : '',
        item.createdBy || ''
      ];
    case 'vehicle-history':
      return [
        item.code || '',
        item.logType || '',
        item.maintenanceType || '',
        item.note || '',
        item.employee || '',
        item.createdAt ? new Date(item.createdAt).toLocaleDateString('es-ES') : ''
      ];
    case 'mechanic-work':
      return [
        item.employeeName || '',
        item.workOrdersCount?.toString() || '0',
        item.totalHours?.toString() || '0',
        item.maintenanceType || '',
        item.period || ''
      ];
    case 'spare-parts':
      return [
        item.productName || '',
        item.category || '',
        item.quantity?.toString() || '0',
        item.unit || '',
        item.totalUsed?.toString() || '0'
      ];
    case 'vehicle-parts':
      return [
        item.productName || '',
        item.model || '',
        item.quantity?.toString() || '0',
        item.unit || '',
        item.frequency?.toString() || '0'
      ];
    default:
      return [];
  }
}
