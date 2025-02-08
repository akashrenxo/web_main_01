import { writable, type Writable, get } from 'svelte/store';

// Types
interface ColumnWidths {
    [key: string]: number;
}

interface TableState {
    draggedColumn: string | null;
    dragOverColumn: string | null;
    currentColumnIndex: number | null;
    startX: number;
    startWidth: number;
    isResizing: boolean;
}

// Store Creation
export const createTableStores = () => {
    const columnOrder = writable<string[]>([]);
    const columnWidths = writable<ColumnWidths>({});
    const tableState = writable<TableState>({
        draggedColumn: null,
        dragOverColumn: null,
        currentColumnIndex: null,
        startX: 0,
        startWidth: 0,
        isResizing: false
    });

    return {
        columnOrder,
        columnWidths,
        tableState
    };
};

// Drag and Drop Functions
export const dragAndDropHandlers = (columnOrder: Writable<string[]>, tableState: Writable<TableState>) => {
    function handleDragStart(event: DragEvent, column: string) {
        if (!event.dataTransfer) return;
        tableState.update(state => ({ ...state, draggedColumn: column }));
        event.dataTransfer.effectAllowed = 'move';
    }

    function handleDragOver(event: DragEvent, column: string) {
        event.preventDefault();
        tableState.update(state => {
            if (state.draggedColumn !== column) {
                return { ...state, dragOverColumn: column };
            }
            return state;
        });
    }

    function handleDragLeave() {
        tableState.update(state => ({ ...state, dragOverColumn: null }));
    }

    function handleDrop(event: DragEvent, targetColumn: string) {
        event.preventDefault();
        
        tableState.update(state => {
            if (!state.draggedColumn || state.draggedColumn === targetColumn) {
                return { ...state, draggedColumn: null, dragOverColumn: null };
            }

            columnOrder.update(currentColumns => {
                const columns = [...currentColumns];
                const draggedIdx = columns.indexOf(state.draggedColumn!);
                const targetIdx = columns.indexOf(targetColumn);

                columns.splice(draggedIdx, 1);
                columns.splice(targetIdx, 0, state.draggedColumn!);

                return columns;
            });

            return { ...state, draggedColumn: null, dragOverColumn: null };
        });
    }

    function handleDragEnd() {
        tableState.update(state => ({
            ...state,
            draggedColumn: null,
            dragOverColumn: null
        }));
    }

    return {
        handleDragStart,
        handleDragOver,
        handleDragLeave,
        handleDrop,
        handleDragEnd
    };
};

// Resize Handler Class
export class TableResizeHandler {
    private columnOrder: Writable<string[]>;
    private columnWidths: Writable<ColumnWidths>;
    private tableState: Writable<TableState>;
    private handleMouseMove: (event: MouseEvent) => void;
    private stopResize: () => void;

    constructor(
        columnOrder: Writable<string[]>,
        columnWidths: Writable<ColumnWidths>,
        tableState: Writable<TableState>
    ) {
        this.columnOrder = columnOrder;
        this.columnWidths = columnWidths;
        this.tableState = tableState;

        // Bind methods to preserve 'this' context
        this.handleMouseMove = this.handleMouseMoveEvent.bind(this);
        this.stopResize = this.stopResizeEvent.bind(this);
    }

    startResize(columnName: string, event: MouseEvent) {
        event.preventDefault();
        
        this.columnOrder.subscribe(order => {
            this.tableState.update(state => ({
                ...state,
                currentColumnIndex: order.indexOf(columnName),
                startX: event.pageX,
                startWidth: get(this.columnWidths)[columnName] || 150,
                isResizing: true
            }));
        })();

        document.body.classList.add('select-none');
        document.addEventListener('mousemove', this.handleMouseMove);
        document.addEventListener('mouseup', this.stopResize);
    }

    private handleMouseMoveEvent(event: MouseEvent) {
        this.tableState.update(state => {
            if (!state.isResizing || state.currentColumnIndex === null) return state;

            this.columnOrder.subscribe(order => {
                const columnName = order[state.currentColumnIndex!];
                const diff = event.pageX - state.startX;
                const newWidth = Math.max(100, state.startWidth + diff);

                this.columnWidths.update(widths => ({
                    ...widths,
                    [columnName]: newWidth
                }));
            })();

            return state;
        });
    }

    private stopResizeEvent() {
        this.tableState.update(state => ({
            ...state,
            isResizing: false,
            currentColumnIndex: null
        }));
        
        document.body.classList.remove('select-none');
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.stopResize);
    }

    cleanup() {
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.stopResize);
    }
}

// Initialize Column Widths
export const initializeColumnWidths = (
    attributes: any[],
    columnWidths: Writable<ColumnWidths>
) => {
    columnWidths.update(widths => {
        const newWidths = { ...widths };
        attributes.forEach(attr => {
            if (!newWidths[attr.name]) {
                const width = getDefaultColumnWidth(attr.data_type);
                newWidths[attr.name] = width;
            }
        });
        return newWidths;
    });
};

// Helper function to determine default column width based on data type
function getDefaultColumnWidth(dataType: string): number {
    switch (dataType) {
        case 'id':
            return 200;
        case 'text':
            return 200;
        case 'date':
            return 200;
        default:
            return 200;
    }
}