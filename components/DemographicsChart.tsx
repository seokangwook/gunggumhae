import { pct } from '@/lib/utils';

interface DemoData {
  gender: { male: number; female: number; other: number; skip: number };
  age: {
    '10s': number;
    '20s': number;
    '30s': number;
    '40s': number;
    '50s': number;
    '60s+': number;
    skip: number;
  };
  total: number;
}

interface DemographicsChartProps {
  data: DemoData;
}

function Bar({ label, count, total }: { label: string; count: number; total: number }) {
  const p = pct(count, total);
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-10 text-right text-gray-500 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-violet-400 rounded-full transition-all duration-500"
          style={{ width: `${p}%` }}
        />
      </div>
      <span className="w-10 text-gray-600 font-medium">{p}%</span>
    </div>
  );
}

export default function DemographicsChart({ data }: DemographicsChartProps) {
  const genderTotal = data.gender.male + data.gender.female + data.gender.other + data.gender.skip;
  const ageTotal = Object.values(data.age).reduce((a, b) => a + b, 0);

  if (data.total === 0) return null;

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold text-gray-600 mb-3">성별</h4>
        <div className="space-y-2">
          <Bar label="남성" count={data.gender.male} total={genderTotal} />
          <Bar label="여성" count={data.gender.female} total={genderTotal} />
          <Bar label="기타" count={data.gender.other} total={genderTotal} />
        </div>
      </div>
      <div>
        <h4 className="text-sm font-semibold text-gray-600 mb-3">나이대</h4>
        <div className="space-y-2">
          {(['10s', '20s', '30s', '40s', '50s', '60s+'] as const).map((band) => (
            <Bar key={band} label={band} count={data.age[band]} total={ageTotal} />
          ))}
        </div>
      </div>
    </div>
  );
}
