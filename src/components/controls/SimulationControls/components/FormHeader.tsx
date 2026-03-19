type FormHeaderProps = {
  title: string;
  description: string;
};

export function FormHeader({title, description}: FormHeaderProps) {
  return (
    <>
        <div className="text-xs font-semibold text-text-primary">{title}</div>
        <div className="text-[11px] text-text-secondary">{description}</div>
    </>
  );
}
