# Responsive Table Component - Usage Examples

## Overview

The `ResponsiveTable` component provides a mobile-first approach to displaying tabular data. It automatically switches between a traditional table view on desktop and a card-based layout on mobile devices.

## Key Features

- **Mobile-First Design**: Automatically switches to card view on mobile screens
- **Progressive Disclosure**: Hide less important columns on smaller screens
- **Priority-Based Layout**: Columns are ordered by priority on mobile
- **Custom Mobile Rendering**: Override how data appears on mobile
- **Consistent Styling**: Uses the same design system as other components

## Basic Usage

```tsx
import { ResponsiveTable, createTextColumn, createActionsColumn } from '@/components/ui/responsive-table';

const columns = [
  createTextColumn('name', 'Name', (item) => item.name, { priority: 1 }),
  createTextColumn('email', 'Email', (item) => item.email, { priority: 2 }),
  createActionsColumn('actions', 'Actions', (item) => (
    <Button onClick={() => handleEdit(item)}>Edit</Button>
  )),
];

<ResponsiveTable
  data={users}
  columns={columns}
  keyExtractor={(user) => user.id}
  title="Users"
  description="Manage user accounts"
/>
```

## Column Types

### Text Column
```tsx
createTextColumn(
  'name',           // key
  'Name',           // label
  (item) => item.name, // getValue function
  { 
    hideOnMobile: true,    // Hide on mobile
    hideOnTablet: true,    // Hide on tablet
    priority: 1            // Higher = more important
  }
)
```

### Badge Column
```tsx
createBadgeColumn(
  'status',
  'Status',
  (item) => item.status,
  (item) => item.status === 'active' ? 'default' : 'secondary'
)
```

### Currency Column
```tsx
createCurrencyColumn(
  'price',
  'Price',
  (item) => item.price,
  { currency: 'USD' }
)
```

### Date Column
```tsx
createDateColumn(
  'created_at',
  'Created',
  (item) => item.created_at,
  { format: 'datetime' } // 'date', 'datetime', 'time'
)
```

### Actions Column
```tsx
createActionsColumn(
  'actions',
  'Actions',
  (item) => (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => onEdit(item)}>
        <Edit className="h-4 w-4 mr-1" />
        Edit
      </Button>
      <Button variant="destructive" size="sm" onClick={() => onDelete(item.id)}>
        <Trash2 className="h-4 w-4 mr-1" />
        Delete
      </Button>
    </div>
  )
)
```

## Custom Column Rendering

For more complex columns, define them manually:

```tsx
const columns = [
  {
    key: 'user',
    label: 'User',
    priority: 1,
    render: (user) => (
      <div>
        <div className="font-medium">{user.name}</div>
        <div className="text-sm text-muted-foreground">{user.email}</div>
      </div>
    ),
    mobileRender: (user) => (
      <div className="text-right">
        <div className="font-medium">{user.name}</div>
        <div className="text-sm text-muted-foreground">{user.email}</div>
      </div>
    ),
  },
];
```

## Responsive Breakpoints

- **Mobile**: `< 1024px` (lg breakpoint)
- **Tablet**: `< 1280px` (xl breakpoint)
- **Desktop**: `>= 1024px`

## Best Practices

1. **Set Priorities**: Use priority to control column order on mobile
2. **Hide Secondary Info**: Use `hideOnMobile` for less important columns
3. **Custom Mobile Rendering**: Override `mobileRender` for better mobile UX
4. **Consistent Actions**: Always show actions on mobile
5. **Meaningful Labels**: Use clear, concise column labels

## Examples in the Codebase

- **ProductList**: Shows products with pricing and actions
- **UserTable**: Displays user information with roles and status
- **OrdersTable**: Shows order details with customer info
- **SupplierList**: Lists suppliers with contact information

## Migration from Regular Tables

1. Replace `<table>` with `<ResponsiveTable>`
2. Convert `<th>` elements to column definitions
3. Convert `<td>` elements to render functions
4. Set appropriate priorities and visibility options
5. Test on mobile devices
