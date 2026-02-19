export function TableRowSkeleton({
  columns = 5,
  rows = 1,
}: {
  columns?: number;
  rows?: number;
}) {
  const widthClasses = [
    "w-20",
    "w-28",
    "w-24",
    "w-32",
    "w-16",
    "w-36",
    "w-20",
    "w-28",
    "w-24",
  ];

  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={`skeleton-row-${rowIndex}`} className="animate-pulse">
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <td key={`skeleton-cell-${rowIndex}-${columnIndex}`} className="px-4 py-3">
              <div
                className={`h-4 rounded-lg bg-gray-200 ${widthClasses[columnIndex % widthClasses.length]}`}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
