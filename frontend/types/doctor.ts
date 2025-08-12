export interface DoctorCreateRequest {
  doctor_id: string;
  first_name: string;
  last_name: string;
  organization_id: string;
  doctor_data?: any;
}

export interface DoctorUpdateRequest {
  first_name?: string;
  last_name?: string;
  organization_id?: string;
  doctor_data?: any;
}

export interface DoctorResponse {
  doctor_id: string;
  first_name: string;
  last_name: string;
  organization_id: string;
  calendar_id?: string;
  doctor_data?: any;
  created_at: string;
  updated_at: string;
  message: string;
}

export interface Doctor {
  doctor_id: string;
  first_name: string;
  last_name: string;
  organization_id: string;
  calendar_id?: string;
  doctor_data?: any;
  created_at: string;
  updated_at: string;
}

export interface OrganizationDoctorsResponse {
  organization_id: string;
  total_doctors: number;
  doctors: Doctor[];
}

export interface DeleteDoctorResponse {
  message: string;
  doctor_id: string;
} 