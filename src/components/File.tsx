import { ChangeEvent } from "react";

const File = ({value, onChange}: {
  value: string,
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
}) => {
  return (
    <span className="bg-blue-100 text-black px-5 py-1 rounded-md ml-2 cursor-pointer">
      <input type="file" id="file-input" className="hidden" value={value} onChange={e => onChange(e)}/>

      <label className="text-sm font-bold" htmlFor="file-input">
        Load wallets
      </label>
    </span>
  )
};

export default File;
