import svgPaths from "./svg-1e1fvdy3rb";
import imgImage10 from "./5bed3275d794dd20bf1238cc85d8bdb9a4b58c0c.png";
import imgZadLogo from "./3d8d0712ce97c2d2f6f970aac02e801d852bd935.png";
type EmailInputProps = {
  className?: string;
  property1?: "Default" | "Variant2";
};

function EmailInput({ className, property1 = "Default" }: EmailInputProps) {
  const isVariant2 = property1 === "Variant2";
  return (
    <button className={className || "block h-[49.6px] relative w-[272px]"}>
      <div className={`absolute bg-white border-solid h-[49.6px] left-0 rounded-[12px] top-0 w-[272px] ${isVariant2 ? "border-[#3b82f6] border-[1.2px]" : "border-[#e5e7eb] border-[0.8px] overflow-clip"}`} data-name="Email Input">
        {property1 === "Default" && (
          <p className="-translate-x-full [word-break:break-word] absolute font-['Cairo:Regular',sans-serif] font-normal leading-[normal] left-[224.2px] not-italic text-[14px] text-[rgba(10,10,10,0.5)] text-right top-[11px] whitespace-nowrap" dir="auto">
            أدخل بريدك الإلكتروني
          </p>
        )}
      </div>
      <div className="absolute content-stretch flex flex-col items-start left-[238px] size-[18px] top-[15.8px]" data-name="Container">
        <div className="h-[18px] overflow-clip relative shrink-0 w-full" data-name="Icon">
          <div className="absolute inset-[29.17%_8.33%_45.84%_8.33%]" data-name="Vector">
            <div className="absolute inset-[-16.68%_-5%_-16.67%_-5%]">
              <svg className="block size-full" fill="none" height="5.99826" preserveAspectRatio="none" viewBox="0 0 16.5002 5.99826" width="16.5002">
                <path d={svgPaths.p20be3c00} id="Vector" stroke="#6A1B9A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
              </svg>
            </div>
          </div>
          <div className="absolute inset-[16.67%_8.33%]" data-name="Vector">
            <div className="absolute inset-[-6.25%_-5%]">
              <svg className="block size-full" fill="none" height="13.5" preserveAspectRatio="none" viewBox="0 0 16.5 13.5" width="16.5">
                <path d={svgPaths.pdc4ad80} id="Vector" stroke="#6A1B9A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      {isVariant2 && <div className="absolute bg-[#b7b7b7] h-[25px] left-[223px] top-[12.05px] w-[2px]" />}
    </button>
  );
}
type PasswordContainerProps = {
  className?: string;
  state?: "Default" | "Variant2" | "Variant3" | "Variant4" | "state5";
};

function PasswordContainer({ className, state = "Default" }: PasswordContainerProps) {
  if (state === "Variant2") {
    return (
      <button className={className || "block cursor-pointer h-[49.6px] relative w-[272px]"} data-name="state=Variant2">
        <div className="absolute bg-white h-[49.6px] left-0 rounded-[12px] top-0 w-[272px]" data-name="Password Input">
          <div className="content-stretch flex items-center overflow-clip px-[44px] py-[14px] relative rounded-[inherit] size-full">
            <div className="absolute bg-[#b7b7b7] h-[25px] left-[223px] top-[12.4px] w-[2px]" />
          </div>
          <div aria-hidden className="absolute border-[#3b82f6] border-[1.2px] border-solid inset-0 pointer-events-none rounded-[12px]" />
        </div>
        <div className="absolute content-stretch flex flex-col items-start left-[238px] size-[18px] top-[15.8px]" data-name="Password Icon">
          <div className="h-[18px] overflow-clip relative shrink-0 w-full" data-name="Icon">
            <div className="absolute inset-[45.83%_12.5%_8.33%_12.5%]" data-name="Vector">
              <div className="absolute inset-[-9.09%_-5.56%]">
                <svg className="block size-full" fill="none" height="9.75" preserveAspectRatio="none" viewBox="0 0 15 9.75" width="15">
                  <path d={svgPaths.p3c7bdc00} id="Vector" stroke="#6A1B9A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                </svg>
              </div>
            </div>
            <div className="absolute inset-[8.33%_29.17%_54.17%_29.17%]" data-name="Vector">
              <div className="absolute inset-[-11.11%_-10%]">
                <svg className="block size-full" fill="none" height="8.25" preserveAspectRatio="none" viewBox="0 0 9 8.25" width="9">
                  <path d={svgPaths.p3127a800} id="Vector" stroke="#6A1B9A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute content-stretch flex flex-col items-start left-[16px] size-[18px] top-[15.8px]" role="button" tabIndex={0} data-name="Eye Button">
          <div className="bg-white h-[18px] overflow-clip relative shrink-0 w-full" data-name="Icon">
            <div className="absolute inset-[20.84%_8.33%]" data-name="Vector">
              <div className="absolute inset-[-7.14%_-5%]">
                <svg className="block size-full" fill="none" height="11.9991" preserveAspectRatio="none" viewBox="0 0 16.5008 11.9991" width="16.5008">
                  <path d={svgPaths.p2be95100} id="Vector" stroke="#6A1B9A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                </svg>
              </div>
            </div>
            <div className="absolute inset-[37.5%]" data-name="Vector">
              <div className="absolute inset-[-16.67%]">
                <svg className="block size-full" fill="none" height="6" preserveAspectRatio="none" viewBox="0 0 6 6" width="6">
                  <path d={svgPaths.p93ea200} id="Vector" stroke="#6A1B9A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </button>
    );
  }
  if (state === "Variant3") {
    return (
      <div className={className || "h-[49.6px] relative w-[272px]"} data-name="state=Variant3">
        <div className="absolute bg-white h-[49.6px] left-0 rounded-[12px] top-0 w-[272px]" data-name="Password Input">
          <div className="content-stretch flex items-center overflow-clip px-[44px] py-[14px] relative rounded-[inherit] size-full">
            <div className="absolute content-stretch flex gap-px h-[10px] items-center left-[116px] top-[19.8px]" data-name="password stars">
              <div className="relative shrink-0 size-[10px]" data-name="image 10">
                <img alt="" className="absolute inset-0 max-w-none object-cover opacity-70 pointer-events-none size-full" src={imgImage10} />
              </div>
              <div className="relative shrink-0 size-[10px]" data-name="image 6">
                <img alt="" className="absolute inset-0 max-w-none object-cover opacity-70 pointer-events-none size-full" src={imgImage10} />
              </div>
              <div className="relative shrink-0 size-[10px]" data-name="image 5">
                <img alt="" className="absolute inset-0 max-w-none object-cover opacity-70 pointer-events-none size-full" src={imgImage10} />
              </div>
              <div className="relative shrink-0 size-[10px]" data-name="image 1">
                <img alt="" className="absolute inset-0 max-w-none object-cover opacity-70 pointer-events-none size-full" src={imgImage10} />
              </div>
              <div className="relative shrink-0 size-[10px]" data-name="image 2">
                <img alt="" className="absolute inset-0 max-w-none object-cover opacity-70 pointer-events-none size-full" src={imgImage10} />
              </div>
              <div className="relative shrink-0 size-[10px]" data-name="image 3">
                <img alt="" className="absolute inset-0 max-w-none object-cover opacity-70 pointer-events-none size-full" src={imgImage10} />
              </div>
              <div className="relative shrink-0 size-[10px]" data-name="image 4">
                <img alt="" className="absolute inset-0 max-w-none object-cover opacity-70 pointer-events-none size-full" src={imgImage10} />
              </div>
              <div className="relative shrink-0 size-[10px]" data-name="image 7">
                <img alt="" className="absolute inset-0 max-w-none object-cover opacity-70 pointer-events-none size-full" src={imgImage10} />
              </div>
              <div className="relative shrink-0 size-[10px]" data-name="image 8">
                <img alt="" className="absolute inset-0 max-w-none object-cover opacity-70 pointer-events-none size-full" src={imgImage10} />
              </div>
              <div className="relative shrink-0 size-[10px]" data-name="image 9">
                <img alt="" className="absolute inset-0 max-w-none object-cover opacity-70 pointer-events-none size-full" src={imgImage10} />
              </div>
            </div>
          </div>
          <div aria-hidden className="absolute border-[#3b82f6] border-[1.2px] border-solid inset-0 pointer-events-none rounded-[12px]" />
        </div>
        <div className="absolute content-stretch flex flex-col items-start left-[238px] size-[18px] top-[15.8px]" data-name="Password Icon">
          <div className="h-[18px] overflow-clip relative shrink-0 w-full" data-name="Icon">
            <div className="absolute inset-[45.83%_12.5%_8.33%_12.5%]" data-name="Vector">
              <div className="absolute inset-[-9.09%_-5.56%]">
                <svg className="block size-full" fill="none" height="9.75" preserveAspectRatio="none" viewBox="0 0 15 9.75" width="15">
                  <path d={svgPaths.p3c7bdc00} id="Vector" stroke="#6A1B9A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                </svg>
              </div>
            </div>
            <div className="absolute inset-[8.33%_29.17%_54.17%_29.17%]" data-name="Vector">
              <div className="absolute inset-[-11.11%_-10%]">
                <svg className="block size-full" fill="none" height="8.25" preserveAspectRatio="none" viewBox="0 0 9 8.25" width="9">
                  <path d={svgPaths.p3127a800} id="Vector" stroke="#6A1B9A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        <button className="absolute content-stretch cursor-pointer flex flex-col items-start left-[16px] size-[18px] top-[15.8px]" data-name="Eye Button">
          <div className="overflow-clip relative shrink-0 size-[18px]" data-name="Eye off">
            <div className="absolute inset-[4.17%]" data-name="Icon">
              <div className="absolute inset-[-4.85%]">
                <svg className="block size-full" fill="none" height="18.1" preserveAspectRatio="none" viewBox="0 0 18.1 18.1" width="18.1">
                  <path d={svgPaths.p22760480} id="Icon" stroke="#6A1B9A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
                </svg>
              </div>
            </div>
          </div>
        </button>
        <button className="absolute block cursor-pointer left-[16px] size-[18px] top-[15.8px]" data-name="Eye Button" />
      </div>
    );
  }
  if (state === "Variant4") {
    return (
      <button className={className || "block cursor-pointer h-[49.6px] relative w-[272px]"} data-name="state=Variant4">
        <div className="absolute bg-white h-[49.6px] left-0 rounded-[12px] top-0 w-[272px]" data-name="Password Input">
          <div className="content-stretch flex items-center overflow-clip px-[44px] py-[14px] relative rounded-[inherit] size-full">
            <p className="-translate-x-full [word-break:break-word] absolute font-['Cairo:Regular',sans-serif] font-normal leading-[normal] left-[225px] not-italic text-[14px] text-[rgba(10,10,10,0.5)] text-right top-[12px] w-[98px]" dir="auto">
              pass354687wrd
            </p>
          </div>
          <div aria-hidden className="absolute border-[#3b82f6] border-[1.2px] border-solid inset-0 pointer-events-none rounded-[12px]" />
        </div>
        <div className="absolute content-stretch flex flex-col items-start left-[238px] size-[18px] top-[15.8px]" data-name="Password Icon">
          <div className="h-[18px] overflow-clip relative shrink-0 w-full" data-name="Icon">
            <div className="absolute inset-[45.83%_12.5%_8.33%_12.5%]" data-name="Vector">
              <div className="absolute inset-[-9.09%_-5.56%]">
                <svg className="block size-full" fill="none" height="9.75" preserveAspectRatio="none" viewBox="0 0 15 9.75" width="15">
                  <path d={svgPaths.p3c7bdc00} id="Vector" stroke="#6A1B9A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                </svg>
              </div>
            </div>
            <div className="absolute inset-[8.33%_29.17%_54.17%_29.17%]" data-name="Vector">
              <div className="absolute inset-[-11.11%_-10%]">
                <svg className="block size-full" fill="none" height="8.25" preserveAspectRatio="none" viewBox="0 0 9 8.25" width="9">
                  <path d={svgPaths.p3127a800} id="Vector" stroke="#6A1B9A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute content-stretch flex flex-col items-start left-[16px] size-[18px] top-[15.8px]" role="button" tabIndex={0} data-name="Eye Button">
          <div className="bg-white h-[18px] overflow-clip relative shrink-0 w-full" data-name="Icon">
            <div className="absolute inset-[20.84%_8.33%]" data-name="Vector">
              <div className="absolute inset-[-7.14%_-5%]">
                <svg className="block size-full" fill="none" height="11.9991" preserveAspectRatio="none" viewBox="0 0 16.5008 11.9991" width="16.5008">
                  <path d={svgPaths.p2be95100} id="Vector" stroke="#6A1B9A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                </svg>
              </div>
            </div>
            <div className="absolute inset-[37.5%]" data-name="Vector">
              <div className="absolute inset-[-16.67%]">
                <svg className="block size-full" fill="none" height="6" preserveAspectRatio="none" viewBox="0 0 6 6" width="6">
                  <path d={svgPaths.p93ea200} id="Vector" stroke="#6A1B9A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </button>
    );
  }
  if (state === "state5") {
    return (
      <div className={className || "h-[49.6px] relative w-[272px]"} data-name="state=state5">
        <div className="absolute bg-white h-[49.6px] left-0 rounded-[12px] top-0 w-[272px]" data-name="Password Input">
          <div className="content-stretch flex items-center overflow-clip px-[44px] py-[14px] relative rounded-[inherit] size-full">
            <button className="absolute block cursor-pointer left-[16px] overflow-clip size-[18px] top-[15px]" data-name="Eye off">
              <div className="absolute inset-[4.17%]" data-name="Icon">
                <div className="absolute inset-[-4.85%]">
                  <svg className="block size-full" fill="none" height="18.1" preserveAspectRatio="none" viewBox="0 0 18.1 18.1" width="18.1">
                    <path d={svgPaths.p22760480} id="Icon" stroke="#6A1B9A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
                  </svg>
                </div>
              </div>
            </button>
          </div>
          <div aria-hidden className="absolute border-[#3b82f6] border-[1.2px] border-solid inset-0 pointer-events-none rounded-[12px]" />
        </div>
        <div className="absolute content-stretch flex flex-col items-start left-[238px] size-[18px] top-[15.8px]" data-name="Password Icon">
          <div className="h-[18px] overflow-clip relative shrink-0 w-full" data-name="Icon">
            <div className="absolute inset-[45.83%_12.5%_8.33%_12.5%]" data-name="Vector">
              <div className="absolute inset-[-9.09%_-5.56%]">
                <svg className="block size-full" fill="none" height="9.75" preserveAspectRatio="none" viewBox="0 0 15 9.75" width="15">
                  <path d={svgPaths.p3c7bdc00} id="Vector" stroke="#6A1B9A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                </svg>
              </div>
            </div>
            <div className="absolute inset-[8.33%_29.17%_54.17%_29.17%]" data-name="Vector">
              <div className="absolute inset-[-11.11%_-10%]">
                <svg className="block size-full" fill="none" height="8.25" preserveAspectRatio="none" viewBox="0 0 9 8.25" width="9">
                  <path d={svgPaths.p3127a800} id="Vector" stroke="#6A1B9A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <button className={className || "block cursor-pointer h-[49.6px] relative w-[272px]"} data-name="state=Default">
      <div className="absolute bg-white h-[49.6px] left-0 rounded-[12px] top-0 w-[272px]" data-name="Password Input">
        <div className="content-stretch flex items-center overflow-clip px-[44px] py-[14px] relative rounded-[inherit] size-full">
          <p className="-translate-x-full [word-break:break-word] absolute font-['Cairo:Regular',sans-serif] font-normal leading-[normal] left-[225px] not-italic text-[14px] text-[rgba(10,10,10,0.5)] text-right top-[11.8px] w-[98px]" dir="auto">
            أدخل كلمة المرور
          </p>
        </div>
        <div aria-hidden className="absolute border-[#e5e7eb] border-[0.8px] border-solid inset-0 pointer-events-none rounded-[12px]" />
      </div>
      <div className="absolute content-stretch flex flex-col items-start left-[238px] size-[18px] top-[15.8px]" data-name="Password Icon">
        <div className="h-[18px] overflow-clip relative shrink-0 w-full" data-name="Icon">
          <div className="absolute inset-[45.83%_12.5%_8.33%_12.5%]" data-name="Vector">
            <div className="absolute inset-[-9.09%_-5.56%]">
              <svg className="block size-full" fill="none" height="9.75" preserveAspectRatio="none" viewBox="0 0 15 9.75" width="15">
                <path d={svgPaths.p3c7bdc00} id="Vector" stroke="#6A1B9A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
              </svg>
            </div>
          </div>
          <div className="absolute inset-[8.33%_29.17%_54.17%_29.17%]" data-name="Vector">
            <div className="absolute inset-[-11.11%_-10%]">
              <svg className="block size-full" fill="none" height="8.25" preserveAspectRatio="none" viewBox="0 0 9 8.25" width="9">
                <path d={svgPaths.p3127a800} id="Vector" stroke="#6A1B9A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute content-stretch flex flex-col items-start left-[16px] size-[18px] top-[15.8px]" data-name="Eye Button">
        <div className="bg-white h-[18px] overflow-clip relative shrink-0 w-full" data-name="Icon">
          <div className="absolute inset-[20.84%_8.33%]" data-name="Vector">
            <div className="absolute inset-[-7.14%_-5%]">
              <svg className="block size-full" fill="none" height="11.9991" preserveAspectRatio="none" viewBox="0 0 16.5008 11.9991" width="16.5008">
                <path d={svgPaths.p2be95100} id="Vector" stroke="#6A1B9A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
              </svg>
            </div>
          </div>
          <div className="absolute inset-[37.5%]" data-name="Vector">
            <div className="absolute inset-[-16.67%]">
              <svg className="block size-full" fill="none" height="6" preserveAspectRatio="none" viewBox="0 0 6 6" width="6">
                <path d={svgPaths.p93ea200} id="Vector" stroke="#6A1B9A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

function Button() {
  return (
    <div className="absolute h-[15.988px] left-[61.23px] top-0 w-[61.737px]" data-name="Button">
      <p className="-translate-x-1/2 [word-break:break-word] absolute font-['Cairo:SemiBold',sans-serif] font-semibold leading-[16px] left-[31px] not-italic text-[#4a148c] text-[12px] text-center top-[-1px] whitespace-nowrap" dir="auto">
        أنشئ حسابًا
      </p>
    </div>
  );
}

function FooterText() {
  return (
    <div className="absolute h-[15.988px] left-[24px] top-[554.83px] w-[272px]" data-name="Footer Text">
      <p className="-translate-x-1/2 [word-break:break-word] absolute font-['Cairo:Regular',sans-serif] font-normal leading-[16px] left-[166.96px] not-italic text-[#0a0a0a] text-[12px] text-center top-[-1px] w-[88px]" dir="auto">
        ليس لديك حساب؟
      </p>
      <Button />
    </div>
  );
}

function AppleLabel() {
  return (
    <div className="h-[15.988px] relative shrink-0 w-[28.688px]" data-name="Apple Label">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-1/2 [word-break:break-word] absolute font-['Cairo:Medium',sans-serif] font-medium leading-[16px] left-[14.5px] not-italic text-[#0a0a0a] text-[12px] text-center top-[-1px] whitespace-nowrap">Apple</p>
      </div>
    </div>
  );
}

function AppleIcon() {
  return (
    <div className="h-[22px] relative shrink-0 w-[18px]" data-name="Apple Icon">
      <svg className="absolute block inset-0 size-full" fill="none" height="22" preserveAspectRatio="none" viewBox="0 0 18 22" width="18">
        <g id="Apple Icon">
          <path d={svgPaths.p150a40f0} fill="black" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Apple() {
  return (
    <div className="bg-white h-[47.6px] relative rounded-[14px] shrink-0 w-[104.287px]" data-name="Apple">
      <div aria-hidden className="absolute border-[#e5e7eb] border-[0.8px] border-solid inset-0 pointer-events-none rounded-[14px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-center justify-center p-[0.8px] relative size-full">
        <AppleLabel />
        <AppleIcon />
      </div>
    </div>
  );
}

function GoogleLabel() {
  return (
    <div className="h-[15.988px] relative shrink-0 w-[35.125px]" data-name="Google label">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-1/2 [word-break:break-word] absolute font-['Cairo:Medium',sans-serif] font-medium leading-[16px] left-[18px] not-italic text-[#0a0a0a] text-[12px] text-center top-[-1px] whitespace-nowrap">Google</p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Google Icon">
      <svg className="absolute block inset-0 size-full" fill="none" height="18" preserveAspectRatio="none" viewBox="0 0 18 18" width="18">
        <g clipPath="url(#clip0_0_78)" id="Google Icon">
          <path d={svgPaths.pcc03b00} fill="#4285F4" id="Vector" />
          <path d={svgPaths.p2e896d80} fill="#34A853" id="Vector_2" />
          <path d={svgPaths.pa38bd00} fill="#FBBC05" id="Vector_3" />
          <path d={svgPaths.p2ecb8280} fill="#EA4335" id="Vector_4" />
        </g>
        <defs>
          <clipPath id="clip0_0_78">
            <rect fill="white" height="18" width="18" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Google() {
  return (
    <div className="bg-white h-[43.6px] relative rounded-[14px] shrink-0 w-[110.725px]" data-name="Google">
      <div aria-hidden className="absolute border-[#e5e7eb] border-[0.8px] border-solid inset-0 pointer-events-none rounded-[14px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-center justify-center p-[0.8px] relative size-full">
        <GoogleLabel />
        <GoogleIcon />
      </div>
    </div>
  );
}

function SocialLogin() {
  return (
    <div className="absolute content-stretch flex gap-[12px] h-[47.6px] items-center justify-center left-[24px] pl-[0.013px] top-[479.19px] w-[272px]" data-name="Social Login">
      <Apple />
      <Google />
    </div>
  );
}

function Container() {
  return <div className="bg-[#e5e7eb] flex-[1_0_0] h-px min-w-px relative" data-name="Container" />;
}

function ContinuedBy() {
  return (
    <div className="h-[15.988px] relative shrink-0 w-[128.762px]" data-name="Continued by">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="[word-break:break-word] absolute font-['Cairo:Regular',sans-serif] font-normal leading-[16px] left-[16px] not-italic text-[#99a1af] text-[12px] top-[-1px] whitespace-nowrap" dir="auto">
          أو الاستمرار بواسطة
        </p>
      </div>
    </div>
  );
}

function Container1() {
  return <div className="bg-[#e5e7eb] flex-[1_0_0] h-px min-w-px relative" data-name="Container" />;
}

function ContinuedByLabel() {
  return (
    <div className="absolute content-stretch flex h-[15.988px] items-center justify-center left-[24px] pr-[0.012px] top-[435.2px] w-[272px]" data-name="Continued by label">
      <Container />
      <ContinuedBy />
      <Container1 />
    </div>
  );
}

function LoginButton() {
  return (
    <div className="absolute drop-shadow-[0px_6px_10px_rgba(74,20,140,0.3)] h-[52px] left-[24px] rounded-[20px] top-[342.2px] w-[272px]" style={{ backgroundImage: "linear-gradient(169.1769887737929deg, rgb(74, 20, 140) 0%, rgb(106, 27, 154) 100%)" }} data-name="Login Button">
      <p className="-translate-x-1/2 [word-break:break-word] absolute font-['Cairo:SemiBold',sans-serif] font-semibold leading-[20px] left-[136.25px] not-italic text-[18px] text-center text-white top-[15.8px] whitespace-nowrap" dir="auto">
        دخول
      </p>
    </div>
  );
}

function Checkbox() {
  return <div className="absolute left-0 size-[16px] top-0" data-name="Checkbox" />;
}

function Text() {
  return (
    <div className="absolute h-[15.988px] left-[24px] top-[0.01px] w-[34.538px]" data-name="Text">
      <p className="[word-break:break-word] absolute font-['Cairo:Medium',sans-serif] font-medium leading-[16px] left-0 not-italic text-[#0a0a0a] text-[12px] top-[-1px] whitespace-nowrap" dir="auto">
        تذكرني
      </p>
    </div>
  );
}

function RememberMeLabel() {
  return (
    <div className="h-[16px] relative shrink-0 w-[58.538px]" data-name="Remember Me Label">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Checkbox />
        <Text />
      </div>
    </div>
  );
}

function ForgetPasswordButton() {
  return (
    <div className="h-[15.988px] relative shrink-0 w-[100.463px]" data-name="forget password button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-1/2 [word-break:break-word] absolute font-['Cairo:SemiBold',sans-serif] font-semibold leading-[16px] left-[50.5px] not-italic text-[#4a148c] text-[12px] text-center top-[-1px] whitespace-nowrap" dir="auto">
          نسيت كلمة المرور؟
        </p>
      </div>
    </div>
  );
}

function Icon() {
  return (
    <div className="relative shrink-0 size-[12px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" height="12" preserveAspectRatio="none" viewBox="0 0 12 12" width="12">
        <g id="Icon">
          <path d="M10 3L4.5 8.5L2 6" id="Vector" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function Container2() {
  return (
    <div className="bg-white flex-[1_0_0] h-[16px] min-w-px relative rounded-[4px]" data-name="Container">
      <div aria-hidden className="absolute border-[#d1d5dc] border-[1.6px] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center p-[1.6px] relative size-full">
        <Icon />
      </div>
    </div>
  );
}

function RememberMeAndForgetPassword() {
  return (
    <div className="absolute content-stretch flex h-[16px] items-center justify-between left-[35px] top-[290px] w-[258px]" data-name="Remember Me and Forget Password">
      <RememberMeLabel />
      <ForgetPasswordButton />
      <button className="absolute cursor-pointer left-0 size-[16px] top-0" data-name="Checkbox">
        <div className="flex flex-row items-center size-full">
          <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center relative size-full">
            <Container2 />
          </div>
        </div>
      </button>
    </div>
  );
}

function EmailLabel() {
  return (
    <div className="absolute h-[20px] left-[24px] top-[97px] w-[272px]" data-name="Email Label">
      <p className="-translate-x-full [word-break:break-word] absolute font-['Cairo:SemiBold',sans-serif] font-semibold leading-[20px] left-[272.51px] not-italic text-[#0a0a0a] text-[14px] text-right top-[-0.2px] whitespace-nowrap" dir="auto">
        البريد الإلكتروني
      </p>
    </div>
  );
}

function Email() {
  return (
    <div className="absolute contents left-[24px] top-[97px]" data-name="Email">
      <EmailLabel />
    </div>
  );
}

function SingupButton() {
  return (
    <div className="flex-[1_0_0] h-[44px] min-w-px relative rounded-[14px]" data-name="singup Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-1/2 [word-break:break-word] absolute font-['Cairo:SemiBold',sans-serif] font-semibold leading-[20px] left-[66.19px] not-italic text-[#9ca3af] text-[14px] text-center top-[11.8px] whitespace-nowrap" dir="auto">
          إنشاء حساب
        </p>
      </div>
    </div>
  );
}

function LoginButton1() {
  return (
    <div className="bg-white drop-shadow-[0px_2px_4px_rgba(0,0,0,0.1)] flex-[1_0_0] h-[44px] min-w-px relative rounded-[14px]" data-name="login Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-1/2 [word-break:break-word] absolute font-['Cairo:SemiBold',sans-serif] font-semibold leading-[20px] left-[66.32px] not-italic text-[14px] text-black text-center top-[11.8px] whitespace-nowrap" dir="auto">
          تسجيل الدخول
        </p>
      </div>
    </div>
  );
}

function SingupOrLoginButton() {
  return (
    <div className="absolute content-stretch flex gap-[8px] h-[44px] items-start left-[24px] top-[24px] w-[272px]" data-name="Singup or Login Button">
      <SingupButton />
      <LoginButton1 />
    </div>
  );
}

function PasswordLabel() {
  return (
    <div className="absolute h-[20px] left-[24px] top-[194px] w-[272px]" data-name="Password label">
      <p className="-translate-x-full [word-break:break-word] absolute font-['Cairo:SemiBold',sans-serif] font-semibold leading-[20px] left-[272.02px] not-italic text-[#0a0a0a] text-[14px] text-right top-[-0.2px] whitespace-nowrap" dir="auto">
        كلمة المرور
      </p>
    </div>
  );
}

function Password() {
  return (
    <div className="absolute contents left-[24px] top-[194px]" data-name="Password">
      <PasswordLabel />
    </div>
  );
}

function LoginCard() {
  return (
    <div className="absolute bg-white drop-shadow-[0px_10px_7.5px_rgba(0,0,0,0.1),0px_4px_3px_rgba(0,0,0,0.1)] h-[705px] left-[46px] rounded-tl-[24px] rounded-tr-[24px] top-[212px] w-[320px]" data-name="Login Card">
      <FooterText />
      <SocialLogin />
      <ContinuedByLabel />
      <LoginButton />
      <RememberMeAndForgetPassword />
      <Email />
      <SingupOrLoginButton />
      <Password />
      <PasswordContainer className="absolute block cursor-pointer h-[49.6px] left-[24px] top-[222px] w-[272px]" />
      <PasswordContainer className="absolute block cursor-pointer h-[49.6px] left-[24px] top-[222px] w-[272px]" />
      <PasswordContainer className="absolute block cursor-pointer h-[49.6px] left-[24px] top-[222px] w-[272px]" />
      <EmailInput className="absolute block cursor-pointer h-[49.6px] left-[24px] top-[125px] w-[272px]" />
      <EmailInput className="absolute block cursor-pointer h-[49.6px] left-[24px] top-[125px] w-[272px]" />
      <EmailInput className="absolute block cursor-pointer h-[49.6px] left-[24px] top-[125px] w-[272px]" />
      <EmailInput className="absolute block cursor-pointer h-[49.6px] left-[24px] top-[125px] w-[272px]" />
    </div>
  );
}

function Container3() {
  return <div className="absolute bg-white left-[271.69px] opacity-40 rounded-[26843500px] size-[4px] top-[45.66px]" data-name="Container" />;
}

function Container4() {
  return <div className="absolute bg-white left-[288.69px] opacity-40 rounded-[26843500px] size-[4px] top-[45.66px]" data-name="Container" />;
}

function Container5() {
  return <div className="absolute bg-white left-[229.69px] opacity-40 rounded-[26843500px] size-[4px] top-[33.66px]" data-name="Container" />;
}

function Container6() {
  return <div className="absolute bg-white left-[285.69px] opacity-40 rounded-[26843500px] size-[4px] top-[89.66px]" data-name="Container" />;
}

function Container7() {
  return <div className="absolute bg-white left-[262.69px] opacity-40 rounded-[26843500px] size-[4px] top-[74.66px]" data-name="Container" />;
}

function Container8() {
  return <div className="absolute bg-white left-[243.69px] opacity-40 rounded-[26843500px] size-[4px] top-[111.66px]" data-name="Container" />;
}

function Container9() {
  return <div className="absolute bg-white left-[1.47px] opacity-40 rounded-[26843500px] size-[4px] top-[227.25px]" data-name="Container" />;
}

function Container10() {
  return <div className="absolute bg-white left-[77.04px] opacity-40 rounded-[26843500px] size-[4px] top-[199.01px]" data-name="Container" />;
}

function Container11() {
  return <div className="absolute bg-white left-[58px] opacity-40 rounded-[26843500px] size-[4px] top-[185px]" data-name="Container" />;
}

function Container12() {
  return <div className="absolute bg-white left-[76px] opacity-40 rounded-[26843500px] size-[4px] top-[167px]" data-name="Container" />;
}

function Container13() {
  return <div className="absolute bg-white left-[33px] opacity-40 rounded-[26843500px] size-[4px] top-[166px]" data-name="Container" />;
}

function Container14() {
  return <div className="absolute bg-white left-[238.01px] opacity-40 rounded-[26843500px] size-[4px] top-[2.26px]" data-name="Container" />;
}

function Container15() {
  return <div className="absolute bg-white left-[170.6px] opacity-40 rounded-[26843500px] size-[4px] top-[82px]" data-name="Container" />;
}

function Container16() {
  return <div className="absolute bg-white left-[75.34px] opacity-40 rounded-[26843500px] size-[4px] top-[103.01px]" data-name="Container" />;
}

function Container17() {
  return <div className="absolute bg-white left-[136.75px] opacity-40 rounded-[26843500px] size-[4px] top-[223.6px]" data-name="Container" />;
}

function Container18() {
  return <div className="absolute bg-white left-[335.84px] opacity-40 rounded-[26843500px] size-[4px] top-[108.06px]" data-name="Container" />;
}

function Container19() {
  return <div className="absolute bg-white left-[300.44px] opacity-40 rounded-[26843500px] size-[4px] top-[13.94px]" data-name="Container" />;
}

function Container20() {
  return <div className="absolute bg-white left-[237.69px] opacity-40 rounded-[26843500px] size-[4px] top-[79.18px]" data-name="Container" />;
}

function Container21() {
  return <div className="absolute bg-white left-[341.75px] opacity-40 rounded-[26843500px] size-[4px] top-[113.9px]" data-name="Container" />;
}

function Container22() {
  return <div className="absolute bg-white left-[322.26px] opacity-40 rounded-[26843500px] size-[4px] top-[214.96px]" data-name="Container" />;
}

function Container23() {
  return <div className="absolute bg-white left-[109.5px] opacity-40 rounded-[26843500px] size-[4px] top-[61.25px]" data-name="Container" />;
}

function Container24() {
  return <div className="absolute bg-white left-[160.5px] opacity-40 rounded-[26843500px] size-[4px] top-[53.25px]" data-name="Container" />;
}

function Container25() {
  return <div className="absolute bg-white left-[168.5px] opacity-40 rounded-[26843500px] size-[4px] top-[35.25px]" data-name="Container" />;
}

function Container26() {
  return <div className="absolute bg-white left-[159.5px] opacity-40 rounded-[26843500px] size-[4px] top-[22.25px]" data-name="Container" />;
}

function Container27() {
  return <div className="absolute bg-white left-[187.5px] opacity-40 rounded-[26843500px] size-[4px] top-[15.25px]" data-name="Container" />;
}

function Container28() {
  return <div className="absolute bg-white left-[132.5px] opacity-40 rounded-[26843500px] size-[4px] top-[33.25px]" data-name="Container" />;
}

function Container29() {
  return <div className="absolute bg-white left-[63.5px] opacity-40 rounded-[26843500px] size-[4px] top-[45.25px]" data-name="Container" />;
}

function Container30() {
  return <div className="absolute bg-white left-[33.5px] opacity-40 rounded-[26843500px] size-[4px] top-[54.25px]" data-name="Container" />;
}

function Container31() {
  return <div className="absolute bg-white left-[63.5px] opacity-40 rounded-[26843500px] size-[4px] top-[72.25px]" data-name="Container" />;
}

function Container32() {
  return <div className="absolute bg-white left-[42.5px] opacity-40 rounded-[26843500px] size-[4px] top-[108.25px]" data-name="Container" />;
}

function Container33() {
  return <div className="absolute bg-white left-[358.01px] opacity-40 rounded-[26843500px] size-[4px] top-[226.84px]" data-name="Container" />;
}

function Container34() {
  return <div className="absolute bg-white left-[127.8px] opacity-40 rounded-[26843500px] size-[4px] top-[0.65px]" data-name="Container" />;
}

function Container35() {
  return <div className="absolute bg-white left-[21.71px] opacity-40 rounded-[26843500px] size-[4px] top-[129.56px]" data-name="Container" />;
}

function Container36() {
  return <div className="absolute bg-white left-[283.53px] opacity-40 rounded-[26843500px] size-[4px] top-[140.69px]" data-name="Container" />;
}

function Container37() {
  return <div className="absolute bg-white left-[252.53px] opacity-40 rounded-[26843500px] size-[4px] top-[135.69px]" data-name="Container" />;
}

function Container38() {
  return <div className="absolute bg-white left-[55.44px] opacity-40 rounded-[26843500px] size-[4px] top-[139.14px]" data-name="Container" />;
}

function Container39() {
  return <div className="absolute bg-white left-[199.34px] opacity-40 rounded-[26843500px] size-[4px] top-[42.41px]" data-name="Container" />;
}

function Container40() {
  return <div className="absolute bg-white left-[290.1px] opacity-40 rounded-[26843500px] size-[4px] top-[133.17px]" data-name="Container" />;
}

function Container41() {
  return <div className="absolute bg-white left-[383.85px] opacity-40 rounded-[26843500px] size-[4px] top-[135.9px]" data-name="Container" />;
}

function Container42() {
  return <div className="absolute bg-white left-[398.85px] opacity-40 rounded-[26843500px] size-[4px] top-[162.9px]" data-name="Container" />;
}

function Container43() {
  return <div className="absolute bg-white left-[386.85px] opacity-40 rounded-[26843500px] size-[4px] top-[216.9px]" data-name="Container" />;
}

function Container44() {
  return <div className="absolute bg-white left-[398.85px] opacity-40 rounded-[26843500px] size-[4px] top-[245.9px]" data-name="Container" />;
}

function Container45() {
  return <div className="absolute bg-white left-[377.85px] opacity-40 rounded-[26843500px] size-[4px] top-[266.9px]" data-name="Container" />;
}

function Container46() {
  return <div className="absolute bg-white left-[390.85px] opacity-40 rounded-[26843500px] size-[4px] top-[291.9px]" data-name="Container" />;
}

function Container47() {
  return <div className="absolute bg-white left-[384.85px] opacity-40 rounded-[26843500px] size-[4px] top-[195.9px]" data-name="Container" />;
}

function Container48() {
  return <div className="absolute bg-white left-[359.85px] opacity-40 rounded-[26843500px] size-[4px] top-[184.9px]" data-name="Container" />;
}

function Container49() {
  return <div className="absolute bg-white left-[341.85px] opacity-40 rounded-[26843500px] size-[4px] top-[159.9px]" data-name="Container" />;
}

function Container50() {
  return <div className="absolute bg-white left-[91.45px] opacity-40 rounded-[26843500px] size-[4px] top-[74.94px]" data-name="Container" />;
}

function Container51() {
  return <div className="absolute bg-white left-[270.79px] opacity-40 rounded-[26843500px] size-[4px] top-[35.2px]" data-name="Container" />;
}

function Container52() {
  return <div className="absolute bg-white left-[214.76px] opacity-40 rounded-[26843500px] size-[4px] top-[145.17px]" data-name="Container" />;
}

function Container53() {
  return <div className="absolute bg-white left-[316.3px] opacity-40 rounded-[26843500px] size-[4px] top-[63.36px]" data-name="Container" />;
}

function Container54() {
  return <div className="absolute bg-white left-[372.3px] opacity-40 rounded-[26843500px] size-[4px] top-[45.36px]" data-name="Container" />;
}

function Container55() {
  return <div className="absolute bg-white left-[362px] opacity-40 rounded-[26843500px] size-[4px] top-[61px]" data-name="Container" />;
}

function Container56() {
  return <div className="absolute bg-white left-[385.3px] opacity-40 rounded-[26843500px] size-[4px] top-[59.36px]" data-name="Container" />;
}

function Container57() {
  return <div className="absolute bg-white left-[336.3px] opacity-40 rounded-[26843500px] size-[4px] top-[41.36px]" data-name="Container" />;
}

function Container58() {
  return <div className="absolute bg-white left-[144.38px] opacity-40 rounded-[26843500px] size-[4px] top-[139.19px]" data-name="Container" />;
}

function Container59() {
  return <div className="absolute bg-white left-[160.38px] opacity-40 rounded-[26843500px] size-[4px] top-[111.19px]" data-name="Container" />;
}

function Container60() {
  return <div className="absolute bg-white left-[382.88px] opacity-40 rounded-[26843500px] size-[4px] top-[93.35px]" data-name="Container" />;
}

function Container61() {
  return <div className="absolute bg-white left-[322.2px] opacity-40 rounded-[26843500px] size-[4px] top-[114.13px]" data-name="Container" />;
}

function Container62() {
  return <div className="absolute bg-white left-[349.2px] opacity-40 rounded-[26843500px] size-[4px] top-[80.13px]" data-name="Container" />;
}

function Container63() {
  return <div className="absolute bg-white left-[10.78px] opacity-40 rounded-[26843500px] size-[4px] top-[211.96px]" data-name="Container" />;
}

function Container64() {
  return <div className="absolute bg-white left-[38.78px] opacity-40 rounded-[26843500px] size-[4px] top-[202.96px]" data-name="Container" />;
}

function Container65() {
  return <div className="absolute bg-white left-[25.78px] opacity-40 rounded-[26843500px] size-[4px] top-[257.96px]" data-name="Container" />;
}

function Container66() {
  return <div className="absolute bg-white left-[34.78px] opacity-40 rounded-[26843500px] size-[4px] top-[322.96px]" data-name="Container" />;
}

function Container67() {
  return <div className="absolute bg-white left-[12.78px] opacity-40 rounded-[26843500px] size-[4px] top-[285.96px]" data-name="Container" />;
}

function Container68() {
  return <div className="absolute bg-white left-[135.4px] opacity-40 rounded-[26843500px] size-[4px] top-[101.94px]" data-name="Container" />;
}

function Container69() {
  return <div className="absolute bg-white left-[108.4px] opacity-40 rounded-[26843500px] size-[4px] top-[112.94px]" data-name="Container" />;
}

function Container70() {
  return <div className="absolute bg-white left-[100.4px] opacity-40 rounded-[26843500px] size-[4px] top-[136.94px]" data-name="Container" />;
}

function Stars() {
  return (
    <div className="absolute contents left-[1.47px] top-[0.65px]" data-name="Stars">
      <Container3 />
      <Container4 />
      <Container5 />
      <Container6 />
      <Container7 />
      <Container8 />
      <Container9 />
      <Container10 />
      <Container11 />
      <Container12 />
      <Container13 />
      <Container14 />
      <Container15 />
      <Container16 />
      <Container17 />
      <Container18 />
      <Container19 />
      <Container20 />
      <Container21 />
      <Container22 />
      <Container23 />
      <Container24 />
      <Container25 />
      <Container26 />
      <Container27 />
      <Container28 />
      <Container29 />
      <Container30 />
      <Container31 />
      <Container32 />
      <Container33 />
      <Container34 />
      <Container35 />
      <Container36 />
      <Container37 />
      <Container38 />
      <Container39 />
      <Container40 />
      <Container41 />
      <Container42 />
      <Container43 />
      <Container44 />
      <Container45 />
      <Container46 />
      <Container47 />
      <Container48 />
      <Container49 />
      <Container50 />
      <Container51 />
      <Container52 />
      <Container53 />
      <Container54 />
      <Container55 />
      <Container56 />
      <Container57 />
      <Container58 />
      <Container59 />
      <Container60 />
      <Container61 />
      <Container62 />
      <Container63 />
      <Container64 />
      <Container65 />
      <Container66 />
      <Container67 />
      <Container68 />
      <Container69 />
      <Container70 />
    </div>
  );
}

function Text1() {
  return (
    <div className="[word-break:break-word] absolute contents left-[185px] not-italic text-center text-white top-[128px] whitespace-nowrap" data-name="text">
      <p className="-translate-x-1/2 absolute font-['Cairo:Regular',sans-serif] font-normal leading-[16px] left-[206.29px] text-[15px] top-[179px]" dir="auto">{` `}</p>
      <p className="-translate-x-1/2 absolute font-['Aref_Ruqaa:Regular',sans-serif] leading-[53.2px] left-[206px] text-[38px] top-[128px] tracking-[2px]" dir="auto">
        زاد
      </p>
    </div>
  );
}

function Header() {
  return (
    <div className="absolute contents left-[157px] top-[-7px]" data-name="Header">
      <Text1 />
      <div className="absolute h-[190px] left-[157px] top-[-7px] w-[99px]" data-name="Zad logo">
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgZadLogo} />
      </div>
    </div>
  );
}

function Container71() {
  return <div className="bg-white h-[14px] relative rounded-[26843500px] shrink-0 w-[3px]" data-name="Container" />;
}

function Container72() {
  return <div className="bg-white h-[12px] relative rounded-[26843500px] shrink-0 w-[3px]" data-name="Container" />;
}

function Container73() {
  return <div className="bg-white h-[10px] relative rounded-[26843500px] shrink-0 w-[3px]" data-name="Container" />;
}

function Container74() {
  return <div className="bg-white flex-[1_0_0] h-[8px] min-w-px relative rounded-[26843500px]" data-name="Container" />;
}

function NetworkSignalIcon() {
  return (
    <div className="absolute flex h-[14px] items-center justify-center left-[54px] top-0 w-[18px]">
      <div className="flex-none rotate-180">
        <div className="content-stretch flex gap-[2px] h-[14px] items-start relative w-[18px]" data-name="Network Signal Icon">
          <Container71 />
          <Container72 />
          <Container73 />
          <Container74 />
        </div>
      </div>
    </div>
  );
}

function Icon1() {
  return (
    <div className="absolute h-[11px] left-[34px] top-[1.5px] w-[14px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" height="11" preserveAspectRatio="none" viewBox="0 0 14 11" width="14">
        <g id="Icon">
          <path d={svgPaths.pdd70680} fill="white" id="Vector" />
          <path d={svgPaths.p23be4a00} fill="white" id="Vector_2" />
          <path d={svgPaths.p1bbe7440} fill="white" id="Vector_3" />
          <path d={svgPaths.p32675500} fill="white" id="Vector_4" />
        </g>
      </svg>
    </div>
  );
}

function Container75() {
  return <div className="absolute bg-white h-[4.8px] left-[2px] rounded-[1px] top-[2px] w-[16.8px]" data-name="Container" />;
}

function Container76() {
  return <div className="absolute bg-white h-[6px] left-[21.8px] rounded-br-[4px] rounded-tr-[4px] top-[1.4px] w-[2px]" data-name="Container" />;
}

function BatteryIcon() {
  return (
    <div className="absolute border-[1.6px] border-solid border-white h-[12px] left-[2px] rounded-[6px] top-px w-[24px]" data-name="Battery Icon">
      <Container75 />
      <Container76 />
    </div>
  );
}

function BatteryAndNetworkSignalIcon() {
  return (
    <div className="h-[14px] relative shrink-0 w-[72px]" data-name="Battery and Network signal icon">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <NetworkSignalIcon />
        <Icon1 />
        <BatteryIcon />
      </div>
    </div>
  );
}

function Time() {
  return (
    <div className="h-[17.325px] relative shrink-0 w-[24.413px]" data-name="Time">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="[word-break:break-word] absolute font-['Cairo:Medium',sans-serif] font-medium leading-[17.333px] left-[-11px] not-italic text-[16px] text-white top-[-1px] whitespace-nowrap" dir="auto">
          ٠٠:٣٦
        </p>
      </div>
    </div>
  );
}

function StatusBarIcons() {
  return (
    <div className="absolute content-stretch flex items-center justify-between left-[3px] px-[24px] top-[7px] w-[409px]" data-name="Status Bar Icons">
      <BatteryAndNetworkSignalIcon />
      <Time />
    </div>
  );
}

function PurpleGradientFrameLogin() {
  return (
    <div className="bg-gradient-to-b col-1 from-[#4a148c] h-[846px] relative row-1 self-start shrink-0 to-[rgba(0,0,0,0)] via-1/2 via-[#6a1b9a] w-[412px]" data-name="Purple Gradient Frame(Login)">
      <LoginCard />
      <Stars />
      <Header />
      <StatusBarIcons />
    </div>
  );
}

export default function Component() {
  return (
    <div className="bg-[rgba(255,255,255,0.98)] gap-x-[10px] gap-y-[10px] grid grid-cols-[repeat(1,minmax(0,1fr))] grid-rows-[repeat(2,minmax(0,1fr))] overflow-clip relative rounded-[30px] shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] size-full" data-name="5">
      <PurpleGradientFrameLogin />
    </div>
  );
}
