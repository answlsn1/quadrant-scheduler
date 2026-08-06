'use client'

/**
 * 날짜·시간 입력 공용 필드 (2026-08-06 사장님 피드백).
 *
 * iOS Safari는 값이 없는 date/time input을 **완전히 빈 칸**으로 그린다 —
 * placeholder 속성도 무시한다. 뭘 눌러야 하는지 보이지 않으니
 * 래퍼에 안내 텍스트를 겹쳐 그 공백을 채운다.
 *
 * 데스크탑 크롬은 반대로 빈 값에도 형식 뼈대("연도-월-일", "--:--")를 그려서
 * 안내 텍스트와 겹쳐 보인다. 그래서 비어 있고 포커스도 없을 때는 네이티브
 * 글자를 투명하게 눕히고(peer), 포커스가 오면 네이티브를 살리고 안내를 숨긴다.
 */
export function PickerField({
  type,
  value,
  onChange,
  placeholder,
  min,
  disabled = false,
  ariaLabel,
  className = '',
  tall = false,
}: {
  type: 'date' | 'time'
  value: string
  onChange: (value: string) => void
  placeholder: string
  min?: string
  disabled?: boolean
  ariaLabel: string
  className?: string
  /** 분류 패널처럼 52px 컨트롤과 나란히 설 때 */
  tall?: boolean
}) {
  const empty = value === ''

  return (
    <span className={`relative block min-w-0 ${className}`}>
      <input
        type={type}
        value={value}
        min={min}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        className={`peer w-full border border-border bg-surface px-3 text-sm disabled:opacity-40 ${
          tall ? 'min-h-[52px] rounded-xl' : 'min-h-[48px] rounded-lg'
        } ${empty ? 'text-transparent focus:text-foreground' : ''}`}
      />
      {empty ? (
        /*
         * 16px 고정 — globals.css가 iOS 확대 방지로 input을 16px로 강제하므로
         * 안내도 같은 크기여야 값을 고르는 순간 글자가 점프하지 않는다 (리뷰 발견).
         */
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-y-0 left-3 flex items-center text-[16px] peer-focus:hidden ${
            disabled ? 'text-muted opacity-40' : 'text-muted'
          }`}
        >
          {placeholder}
        </span>
      ) : null}
    </span>
  )
}
