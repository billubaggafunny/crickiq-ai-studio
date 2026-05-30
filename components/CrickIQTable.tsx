import React from 'react';

export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({ className = '', children, ...props }) => (
    <div className="w-full overflow-x-auto no-scrollbar">
        <table className={`w-full text-left whitespace-nowrap ${className}`} {...props}>
            {children}
        </table>
    </div>
);

export const Thead: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className = '', children, ...props }) => (
    <thead className={`border-b border-black/10 dark:border-white/10 ${className}`} {...props}>
        {children}
    </thead>
);

export const Tbody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className = '', children, ...props }) => (
    <tbody className={`divide-y divide-black/5 dark:divide-white/5 ${className}`} {...props}>
        {children}
    </tbody>
);

export const Tr: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ className = '', children, ...props }) => (
    <tr className={`transition-colors hover:bg-brand-blue/10 ${className}`} {...props}>
        {children}
    </tr>
);

export const Th: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({ className = '', children, ...props }) => (
    <th className={`px-2 py-3 text-[14px] font-semibold text-brand-blue ${className}`} {...props}>
        {children}
    </th>
);

export const Td: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ className = '', children, ...props }) => (
    <td className={`px-2 py-3.5 text-[16px] font-medium text-text-primary ${className}`} {...props}>
        {children}
    </td>
);
