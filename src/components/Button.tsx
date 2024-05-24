import { MouseEvent } from "react";

const Button = ({value, onClick}: {
  value: string,
  onClick: (event: MouseEvent) => void
}) => {
  return (
    <button
      className="bg-blue-100 text-black text-sm font-bold px-5 py-1 rounded-md ml-2 cursor-pointer"
      onClick={e => onClick(e)}>
      {value}
    </button>
  )
};

export default Button;
